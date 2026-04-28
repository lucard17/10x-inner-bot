import { Pool } from 'pg';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import cron from 'node-cron';
import FormData from 'form-data';
import { getEnv } from '../config/env.config';
import TelegramBot from 'node-telegram-bot-api';
import { btlzApi, telegramApi } from '../config/telegram.config';
import { formatError, getFormatReportTitle, getReportMessage } from '../utils/string.utils';
import { connectionsDb } from '../db/connections.model';
import { returnMenu } from '../components/buttons.component';
import { getImageForReport } from '../utils/image.utils';
import { getFormatConnections } from '../utils/parse.utils';
import { User } from '../types/user.types';
import { usersDb } from '../db/users.model';
import pool from '../db/db.config';

const env = getEnv();

const telegramAxios = axios.create(env.PROXY_URL ? {
  httpsAgent: new HttpsProxyAgent(env.PROXY_URL),
  proxy: false,
} : {});

export class ReportService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async sendMessage(chatId: number, text: string, replyMarkup?: TelegramBot.InlineKeyboardMarkup): Promise<number | undefined> {
    try {
      const res = await telegramAxios.post(telegramApi.send.message, {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      });
      console.log(`Report Service: Message sent to chatId ${chatId}`);
      return res.data.result.message_id;
    } catch (error) {
      formatError(error, `Report Service: Failed to send message to chatId ${chatId}`);
      return undefined;
    }
  }

  async sendPhoto(chatId: number, photo: Buffer, caption?: string, replyMarkup?: TelegramBot.InlineKeyboardMarkup): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('photo', photo, { filename: 'report.png', contentType: 'image/png' });
      if (caption) formData.append('caption', caption);
      if (replyMarkup) formData.append('reply_markup', JSON.stringify(replyMarkup));
      formData.append('parse_mode', 'HTML');

      await telegramAxios.post(telegramApi.send.photo, formData, { headers: formData.getHeaders() });
      console.log(`Report Service: Photo sent to chatId ${chatId}`);
    } catch (error: any) {
      console.error('sendPhoto raw error:', JSON.stringify({
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      }, null, 2));
      formatError(error, `Report Service: Failed to send photo to chatId ${chatId}`);
    }
  }

  async getReportSheet(spreadsheetId: string): Promise<any[] | null> {
    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        const response = await axios.post(btlzApi.report(spreadsheetId), btlzApi.reportBody, {
          headers: { Authorization: `Bearer ${btlzApi.token}` },
        });

        if (response.status === 200) {
          return response.data;
        }
        console.log(`Error getting data from 10x server: ${response.status}`);
      } catch (error) {
        console.error(`Retry ${attempts + 1}: 404 Error`);
      }

      attempts++;
      if (attempts < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.error('Max retry attempts reached.');
    return null;
  }

  async processReportForUser(chatId: number, spreadsheetId: string): Promise<void> {
    try {
      const connection = await connectionsDb.getConnection(chatId, spreadsheetId);
      const title = connection?.title ?? 'Connection';

      const sheetData = await this.getReportSheet(spreadsheetId);
      if (!sheetData) {
        await this.sendMessage(chatId, 'Ошибка при получении данных отчета.', returnMenu(false));
        return;
      }

      const marketplace = sheetData[1][11].startsWith('wb') ? '🟣WB' : '🔵OZON';
      let message = getReportMessage(sheetData);
      message = `${marketplace}\n\n${getFormatReportTitle(title)}${message}`;

      const imageBuffer = await getImageForReport(sheetData);
      if (imageBuffer) {
        await this.sendPhoto(chatId, imageBuffer, message, returnMenu(false));
      } else {
        await this.sendMessage(chatId, message, returnMenu(false));
      }
    } catch (error) {
      formatError(error, `Error in processReportForUser for chat ${chatId}:`);
      await this.sendMessage(chatId, `Возникла ошибка при формировании отчёта: ${error}`, returnMenu(false));
    }
  }

  async run(hour?: number): Promise<void> {
    try {
      const currentHour = hour ?? new Date().getHours() + 3;
      const connections = await connectionsDb.getConnectionsByTime(currentHour);

      if (connections.length === 0) {
        console.log(`No connections to report for hour ${currentHour}`);
        return;
      }

      const dataForReports = getFormatConnections(connections);
      for (const spreadsheetId of Object.keys(dataForReports)) {
        for (const chatId of dataForReports[spreadsheetId]) {
          await this.processReportForUser(chatId, spreadsheetId);
        }
      }
    } catch (error) {
      formatError(error, 'Error in report service:');
    }
  }

  async runForUser(user: User, type: 'single' | 'all', spreadsheetId?: string): Promise<void> {
    try {
      if (type === 'single' && spreadsheetId) {
        await this.processReportForUser(user.chat_id, spreadsheetId);
      } else {
        const connections = await connectionsDb.getConnections(user.chat_id);
        for (const connection of connections) {
          await this.processReportForUser(user.chat_id, connection.ss);
        }
      }
    } catch (error) {
      formatError(error, `Error running report for user ${user.chat_id}:`);
    }
  }

  startCronJob(): void {
    if (env.SERVICE_TYPE !== 'report') return;
    cron.schedule('0 4-23 * * *', async () => {
      console.log('Running report service at:', new Date().toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow' }));
      await this.run();
    }, { timezone: 'Europe/Moscow' });
  }
}

export async function runPersonReport(chatId: number, type: 'single' | 'all', spreadsheetId?: string): Promise<number | null> {
  try {
    const user = await usersDb.getUserById(chatId);
    if (!user) return null;

    const reportService = new ReportService(pool);
    await reportService.runForUser(user, type, spreadsheetId);
    return chatId;
  } catch (error) {
    formatError(error, 'Failed to initiate report:');
    return null;
  }
}

const reportService = new ReportService(pool);
reportService.startCronJob();
