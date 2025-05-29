import TelegramBot, { ChatId, InlineKeyboardMarkup, EditMessageTextOptions } from 'node-telegram-bot-api';
import { Redis } from 'ioredis';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';
import { getEnv } from '../config/env.config';
import { ImageType } from '../types/image.types';
import { formatError } from '../utils/string.utils';
import { Message } from '../types/message.types';
import { getPath } from '../utils/parse.utils';
import { mainOptions } from '../components/buttons.component';
import { usersDb } from '../db/users.model';

const env = getEnv();

export interface EditMessageData {
  text?: string;
  options?: InlineKeyboardMarkup;
  image?: ImageType;
}

export class MessageService {
  private static instance: MessageService;
  private bot: TelegramBot;
  private client: Redis;

  private constructor(bot: TelegramBot, client: Redis) {
    this.bot = bot;
    this.client = client;
  }

  static getInstance(bot?: TelegramBot, client?: Redis): MessageService {
    if (!MessageService.instance) {
      if (!bot || !client) throw new Error('MessageService requires bot and redis client for initialization');
      MessageService.instance = new MessageService(bot, client);
    }
    return MessageService.instance;
  }

  async deleteMessage(chatId: ChatId, messageId: number): Promise<void> {
    try {
      await this.bot.deleteMessage(chatId, messageId);
    } catch (error) {
      formatError(error, `Error deleting message ID ${messageId}:`);
    }
  }

  async saveMessage(message: Message): Promise<void> {
    try {
      const messageKey = `messages:${message.chat_id}`;
      const messageData = { ...message, timestamp: Date.now() };
      await this.client.rpush(messageKey, JSON.stringify(messageData));
    } catch (error) {
      formatError(error, 'Error saving message:');
    }
  }

  async saveMessages(messages: Message[]): Promise<void> {
    for (const msg of messages) {
      await this.saveMessage(msg);
    }
  }

  async deleteAllMessages(chatId: number, exclude?: string): Promise<void> {
    try {
      const messages = (await this.getMessages(chatId)).reverse();
      let specialFound = false;

      const deletePromises = messages.map(async (message) => {
        if (exclude && message.special === exclude && !specialFound) {
          specialFound = true;
          return;
        }
        await this.deleteMessage(chatId, message.message_id);
      });
      await Promise.all(deletePromises);
      await this.clearMessages(chatId);
    } catch (error) {
      formatError(error, `Error deleting all messages for chat ${chatId}:`);
    }
  }

  async deleteAllNewMessages(messages: Message[], chatId: number, exclude?: string): Promise<void> {
    const deletePromises = messages.map(async (msg) => {
      if (exclude && msg.special === exclude) return;
      await this.deleteMessage(chatId, msg.message_id);
    });
    await Promise.all(deletePromises);
  }

  async deleteOldAndNewMessages(chatId: number, messages: Message[], exclude?: string): Promise<void> {
    await this.deleteAllMessages(chatId, exclude);
    await this.deleteAllNewMessages(messages, chatId, exclude);
  }

  async getMessages(chatId: number): Promise<Message[]> {
    try {
      const messageKey = `messages:${chatId}`;
      const messages = await this.client.lrange(messageKey, 0, -1);
      return messages.map(msg => JSON.parse(msg));
    } catch (error) {
      formatError(error, `Error retrieving messages for chat ${chatId}:`);
      return [];
    }
  }

  async getSpecialMessage(chatId: number, special: string): Promise<Message | undefined> {
    const messages = await this.getMessages(chatId);
    return messages.find(msg => msg.special === special);
  }

  async clearMessages(chatId: number): Promise<void> {
    try {
      const messageKey = `messages:${chatId}`;
      await this.client.del(messageKey);
    } catch (error) {
      formatError(error, `Error clearing messages for chat ${chatId}:`);
    }
  }

  async sendMessage(chatId: number, text: string, options?: InlineKeyboardMarkup): Promise<TelegramBot.Message> {
    try {
      const res = await this.bot.sendMessage(chatId, text, { parse_mode: 'HTML', reply_markup: options });
      return res;
    } catch (error) {
      formatError(error, `Error sending message to chat ${chatId}:`);
      throw error;
    }
  }

  async editMessage(chatId: ChatId, messageId: number, data: EditMessageData): Promise<void> {
    try {
      if (data.image) {
        console.log(getPath(data.image))
        await this.editMessageMedia(chatId, messageId, getPath(data.image), data.text, data.options);
        return;
      }

      if (data.text) {
        await this.bot.editMessageCaption(data.text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
        } as EditMessageTextOptions);
      }

      if (data.options) {
        await this.bot.editMessageReplyMarkup(data.options, { chat_id: chatId, message_id: messageId });
      }
    } catch (error) {
      formatError(error, `Error editing message ID ${messageId}:`);
      const user = await usersDb.getUserById(chatId as number);
      if (user) {
        await this.clearMessages(user.chat_id);
        const imagePath = data.image ? getPath(data.image) : getPath(ImageType.Hello);
        const message = await this.bot.sendPhoto(user.chat_id, imagePath, {
          caption: data.text || undefined,
          reply_markup: mainOptions(false, user.type ?? 'new'),
          parse_mode: 'HTML',
        });
        await this.saveMessage({ chat_id: user.chat_id, message_id: message.message_id, special: 'menu' });
      }
    }
  }

  private async editMessageMedia(
    chatId: ChatId,
    messageId: number,
    mediaPath: string,
    caption?: string,
    replyMarkup?: InlineKeyboardMarkup,
  ): Promise<void> {
    try {
      const form = new FormData();
      form.append('media', JSON.stringify({
        type: 'photo',
        media: 'attach://photo',
        caption: caption || '',
        parse_mode: 'HTML',
      }));
      form.append('photo', fs.createReadStream(mediaPath));
      form.append('chat_id', chatId);
      form.append('message_id', messageId);
      if (replyMarkup) {
        form.append('reply_markup', JSON.stringify(replyMarkup));
      }

      await axios.post(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/editMessageMedia`, form, {
        headers: form.getHeaders(),
      });
    } catch (error) {
      formatError(error, `Error editing media for message ID ${messageId}:`);
      throw error;
    }
  }
}