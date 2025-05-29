import TelegramBot, { ChatId, InlineKeyboardButton, Message } from 'node-telegram-bot-api';
import { usersDb } from '../db/users.model';
import { mainOptions } from './buttons.component';
import { MessageService } from '../services/message.service';
import { getPath } from '../utils/parse.utils';
import { formatError } from '../utils/string.utils';
import { bot } from '../bot';
import { UserCallback, UserMessage } from '../types/message.types';
import { ImageType } from '../types/image.types';
import { UserType } from '../types/user.types';

/**
 * Sends a help message to the user.
 * @param {ChatId} chatId - Chat ID to send the message to.
 * @returns {Promise<Message>} The sent message.
 */
export async function getHelp(chatId: ChatId): Promise<Message> {
  return bot.sendMessage(chatId, '/menu - Открыть меню бота');
}

/**
 * Handles /start or /menu commands and manages menu rendering.
 * @param {UserMessage | UserCallback} msg - Message or callback data.
 * @param {'/menu' | '/start'} command - Triggered command.
 * @param {boolean} isNewMsg - Whether it's a new message.
 * @param {number} [menuId] - Optional menu message ID for editing.
 */
export async function handleStartMenu(
  msg: UserMessage | UserCallback,
  command: '/menu' | '/start',
  isNewMsg: boolean = true,
  menuId?: number,
): Promise<void> {
  try {
    const users = await usersDb.select({ chat_id: msg.chat_id });
    const isUser = users.rows.length > 0;
    const user = users.rows[0];
    const chatId = msg.chat_id;

    if (!chatId) {
      throw new Error('Missing chat ID');
    }

    const commandToUse = command === '/start' && isUser ? '/menu' : command;
    const text = commandToUse === '/menu' ? ' ' : 'Это телеграм бот для получения ежедневных отчетов по вашему кабинету из Системы 10X.\n\nДля начала работы подключите таблицу:';
    const img = commandToUse === '/menu' ? ImageType.Menu : ImageType.Hello;

    if (isUser) {
      if (!isNewMsg && menuId) {
        await MessageService.getInstance().editMessage(chatId, menuId, { text, options: mainOptions(false, user.type) });
      } else {
        await sendNewMenu(chatId, img, text, user.type);
      }
    } else {
      await usersDb.insert({ chat_id: chatId, username: msg.username, type: 'new' });
      await sendNewMenu(chatId, img, text, 'new');
      console.log('Inserted new user:', chatId, msg.username);
    }
  } catch (error) {
    formatError(error, 'Error processing /start or /menu command:');
    await bot.sendMessage(msg.chat_id, 'Произошла ошибка. Попробуйте позже.');
  }
}

/**
 * Sends a photo with a caption to the user.
 * @param {number} chatId - Chat ID.
 * @param {ImageType} imageName - Image file name.
 * @param {string} [caption] - Optional caption.
 * @param {InlineKeyboardButton[][]} [keyboard] - Optional keyboard.
 * @returns {Promise<Message | void>} The sent message.
 */
export async function sendImageWithText(
  chatId: number,
  imageName: ImageType,
  caption?: string,
  keyboard?: InlineKeyboardButton[][],
): Promise<Message | void> {
  try {
    const imagePath = getPath(imageName);
    return await bot.sendPhoto(chatId, imagePath, {
      caption,
      reply_markup: keyboard ? { inline_keyboard: keyboard } : undefined,
      parse_mode: 'HTML',
    });
  } catch (error) {
    formatError(error, `Error sending image to chat ${chatId}:`);
  }
}

/**
 * Sends a new menu and saves it in the message service.
 * @param {number} chatId - Chat ID.
 * @param {ImageType} img - Image file name.
 * @param {string} caption - Caption for the menu.
 * @param {UserType} userType - User type.
 */
async function sendNewMenu(chatId: number, img: ImageType, caption: string, userType: UserType = 'registered'): Promise<void> {
  const keyboard = mainOptions(false, userType).inline_keyboard;
  const newMenu = await sendImageWithText(chatId, img, caption, keyboard);
  if (newMenu) {
    await MessageService.getInstance().saveMessage({ chat_id: chatId, message_id: newMenu.message_id, special: 'menu' });
  }
}