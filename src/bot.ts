import TelegramBot from 'node-telegram-bot-api';
import { getEnv } from './config/env.config';
import { RedisService } from './services/redis.service';
import { MessageService } from './services/message.service';
import { setBotCommands } from './components/buttons.component';
import { handleCallbackQuery } from './handlers/callback.handler';
import { handleTextMessage } from './handlers/text.handler';
import { handleAdminCommand } from './handlers/admin_handler';

const env = getEnv();
const bot = new TelegramBot(env.TELEGRAM_TOKEN, { polling: true });
const redisService = new RedisService();
const messageService = MessageService.getInstance(bot, redisService.getClient());

setBotCommands(bot);

bot.on('callback_query', async (query) => {
  if (!query.message?.chat.id) return;
  await handleCallbackQuery(query, bot, redisService, messageService);
});

bot.on('message', async (msg) => {
  if (!msg.text || !msg.chat.id) return;

  const userMessage = {
    chat_id: msg.chat.id,
    text: msg.text,
    message_id: msg.message_id,
    username: msg.from?.username,
  };

  if (msg.text.startsWith('/admin__')) {
    await handleAdminCommand(userMessage.chat_id, msg.text, bot);
    return;
  }

  if (['/start', '/menu'].includes(userMessage.text)) {
    await handleTextMessage(userMessage, true, redisService, messageService);
    return;
  }

  await handleTextMessage(userMessage, false, redisService, messageService);
});

console.log('Bot started successfully!');
export { bot, redisService, messageService };