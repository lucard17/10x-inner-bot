import TelegramBot from 'node-telegram-bot-api';
import { getEnv } from './config/env.config';
import { RedisService } from './services/redis.service';
import { MessageService } from './services/message.service';
import { setBotCommands } from './components/buttons.component';
import { handleCallbackQuery } from './handlers/callback.handler';
import { handleTextMessage } from './handlers/text.handler';
import { handleAdminCommand } from './handlers/admin_handler';

process.on('unhandledRejection', (err: any) => {
  console.error('Unhandled rejection:', err?.message ?? err);
});

const env = getEnv();

const botOptions: TelegramBot.ConstructorOptions = {
  polling: {
    interval: 1000,
    autoStart: true,
    params: { timeout: 20 },
  },
};
if (env.PROXY_URL) {
  console.log('Using proxy:', env.PROXY_URL);
  botOptions.request = { proxy: env.PROXY_URL, timeout: 30000 } as any;
} else {
  console.log('No proxy configured');
  botOptions.request = { timeout: 30000 } as any;
}

const bot = new TelegramBot(env.TELEGRAM_TOKEN, botOptions);

bot.on('polling_error', (err: any) => {
  const ts = new Date().toISOString();
  const code = err?.code ?? 'UNKNOWN';
  const msg = err?.message ?? String(err);
  console.error(`[polling][${ts}] ${code}: ${msg}`);
});
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

setInterval(() => {
  const mem = process.memoryUsage();
  console.log(`[health] uptime=${Math.floor(process.uptime())}s rss=${Math.round(mem.rss / 1024 / 1024)}MB heap=${Math.round(mem.heapUsed / 1024 / 1024)}/${Math.round(mem.heapTotal / 1024 / 1024)}MB`);
}, 10 * 60 * 1000);

export { bot, redisService, messageService };