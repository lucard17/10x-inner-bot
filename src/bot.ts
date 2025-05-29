import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { setBotCommands } from './components/buttons.js';
import { redis } from './redis.js';
import { MessageMS, UserMsg } from './types/messages.js';
import { MsgService } from './services/messageService.js';
import { callbackHandler } from './handlers/callbackHandler.js';
import { handleAdminCommand } from './handlers/adminHandler.js';
import { handleMenuCommand, handleUserState } from './handlers/textHandler.js';

dotenv.config();

const token = process.env.TELEGRAM_TOKEN;
if (!token) {
  throw new Error('Telegram token not found');
}

export const bot = new TelegramBot(token, { polling: true });
export const RediceService = new redis();
export const MessageService = new MsgService(bot, RediceService.getClient());

setBotCommands(bot);

bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;
  
  await callbackHandler(query, bot, RediceService, MessageService);
});

bot.on('message', async (msg) => {
  const userMessage = new UserMsg(msg);
  const { chat_id, text, message_id } = userMessage;

  if (!text) return;

  const messageArray: MessageMS[] = [new MessageMS({ chat_id, message_id, content: text })];

  if (text.startsWith('/admin__')) {
    return handleAdminCommand(chat_id, text, bot);
  }

  if (['/start', '/menu'].includes(text)) {
    await handleMenuCommand(userMessage, chat_id, text, messageArray);
    return;
  }

  await handleUserState(chat_id, messageArray, userMessage);
});

console.log('Bot started!');
