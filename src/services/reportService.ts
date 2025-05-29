import { Pool } from 'pg';
import axios from 'axios';
import * as dotenv from 'dotenv';
import cron from 'node-cron';
import express from 'express';
import pool from '../../database/db.js';
import { User } from '../types/user.js';
import { users_db } from '../../database/models/users.js';
import { Options, returnMenu } from '../components/buttons.js';
import { connections_db } from '../../database/models/connections.js';
import { getFormatConnections } from '../utils/parse.js';
import { formatError, getFormatReportTitle, getReportMessage  } from '../utils/string.js';
import FormData from 'form-data';
import { btlz_api, tg_api } from '../fetch_config.js';
import { getImageForReport } from '../utils/image.js';

const app = express();

dotenv.config();

const isReportService = process.env.SERVICE_TYPE === 'report';

app.use(express.json());
dotenv.config();
const port = process.env.BASE_PORT;

app.post('/runReportForUser', async (req, res) => {
  const { chat_id, type, ss } = req.body;
  try {
    const RS = new ReportService(pool);
    const user = await users_db.getUserById(chat_id);
    if (user) {
      const id = await RS.runForUser(user, type, ss);
      res.status(200).send('Report run successfully for user.');
      return id
    } else {
      res.status(404).send('User not found.');
    }
  } catch (error) {
    res.status(500).send('Error running report for user.');
  }
});

app.listen(port, () => {
  console.log(`API Server running on port ${port}`);
});

/**
 * inner request to start personal report
 * @param {number} chat_id - user chat id
 * @param {'single' | 'all'} type - all connections reports or only one
 * @param {string} ss - spreadsheet id
 */
export async function runPersonReport(chat_id: number, type: 'single' | 'all', ss?: string ): Promise<number | null> {
  return await axios.post(`http://localhost:${process.env.BASE_PORT}/runReportForUser`, { chat_id, type, ss })
    .then(response => {
      console.log('Report initiated: ', response.data);
      return response.data; 
    })
    .catch(error => {
      formatError(error, 'Failed to initiate report: ')
      return null;  
    });
}

export class ReportService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async sendMessage(chat_id: number, text: string, reply_markup?: Options['reply_markup'] ) {
    try {
      const res = await axios.post(tg_api.send.message, {
        chat_id,
        text,
        parse_mode: 'HTML',
        reply_markup: reply_markup ? reply_markup : undefined
      });
      console.log(`Report Service: Message sent to chatId: ${chat_id}`);
      return res.data.result.message_id;
    } catch (error) {
      formatError(error, `Report Service: Failed to send message to chatId: ${chat_id}`)
    }
  }

  async sendPhoto(chat_id: number, photo: any, caption?: string, reply_markup?: Options['reply_markup']): Promise<void> {    
    try {
        const formData = new FormData();
        formData.append('chat_id', chat_id);
        formData.append('photo', photo.source, { filename: "report.png", contentType: "image/png" });
        if (caption) formData.append('caption', caption);
        if (reply_markup) formData.append('reply_markup', JSON.stringify(reply_markup));
        formData.append('parse_mode', 'HTML');

        await axios.post(tg_api.send.photo, formData, { headers: formData.getHeaders() });
        console.log(`Report Service: Photo sent to chatId: ${chat_id}`);
    } catch (error) {
        console.error(error);
        formatError(error, `Report Service: Failed to send photo to chatId: ${chat_id}`);
    }
  }

  async getReportSheet(ss: string) {
    const maxRetries = 3;
    let attempts = 0;
  
    while (attempts < maxRetries) {
      try {
        const response = await axios.post(
          btlz_api.report(ss),
          btlz_api.reportBody, 
          { headers: { 'Authorization': 'Bearer ' + btlz_api.token } }
        );
  
        if (response.status === 200) {
          const sheetData = response.data;
          return sheetData;
        } else {
          console.log('Error getting data from 10x server: ' + response.status);
        }
      } catch (e) {
        console.error('Error during request, retrying... Attempt:', attempts + 1);
      }
  
      attempts++;
      if (attempts < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }
  
    console.error('Max retry attempts reached.');
    return null;
  }
  

  async processReportForUser(chat_id: number, ss: string) {
    try {
      const connection = await connections_db.getConnection(chat_id, ss);
      const title = connection.title;
  
      const sheetData = await this.getReportSheet(ss);
      const mp = sheetData[1][11].startsWith('wb') ? '🟣WB' : '🔵OZON'
      let message = getReportMessage(sheetData);
      message = mp + '\n\n' + getFormatReportTitle(title) + message;
      console.log('Sheet data:', JSON.stringify(sheetData));
  
      const imageBuffer = await getImageForReport(sheetData); 
      if (imageBuffer) {
        await this.sendPhoto(chat_id, { source: imageBuffer }, message, returnMenu(false)); 
      } else {
        await this.sendMessage(chat_id, message, returnMenu(false));
      }
    } catch (error) {
      console.error('Error in processReportForUser:', error);
      await this.sendMessage(chat_id, `Возникла ошибка при формировании отчёта: ${error}`, returnMenu(false));
    }
  }

  async run(hour?: number): Promise<void> {
    try {
      const currentHour = hour ? hour : new Date().getHours() + 3;
      const connections = await connections_db.getConnectionsByTime(currentHour);
      
      if (connections.length > 0 ) {
        const dataForReports = getFormatConnections(connections)
        const ssList = Object.keys(dataForReports)

        for (const ss of ssList) {
          for (const chat_id of dataForReports[ss]) {
            await this.processReportForUser(chat_id, ss)
          }
        }
      } else {
        console.log('No connections to report for this hour: '+currentHour);
      }
    } catch (error) {
      formatError(error, 'Error in report service:')
    } 
  }

  async runForUser(user: User, type: 'single' | 'all', ss?: string) {
    try {
      if (type === 'single' && ss) {
        const row = await connections_db.getConnection(user.chat_id, ss) 
        await this.processReportForUser(user.chat_id, ss)
      } else {
        const rows = await connections_db.getConnections(user.chat_id) 
        const ssList = rows.map(row => row.ss)
        for (const ss of ssList) {
          await this.processReportForUser(user.chat_id, ss)
        }
      }
    } catch (error) {
      formatError(error, 'Error running report for user:')
    }
  }

  // Schedule the report service to run every hour from 4 AM to 11 PM
  // at 00 start to getting adv info
  startCronJob() {
    if (isReportService) {
      cron.schedule('0 4-23 * * *', async () => {
        console.log('Running report service at:', new Date().toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow' }));
        await this.run();
      }, {
        timezone: 'Europe/Moscow'
      });
    }
  }
}


export const reportService = new ReportService(pool);
reportService.startCronJob();