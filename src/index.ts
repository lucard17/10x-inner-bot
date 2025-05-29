import express from 'express';
import { Pool } from 'pg';
import { ReportService, runPersonReport } from './services/report.service';
import { bot } from './bot';
import { getEnv } from './config/env.config';
import { formatError } from './utils/string.utils';
import pool from './db/db.config';

const env = getEnv();
const app = express();

app.use(express.json());

app.post('/runReportForUser', async (req, res) => {
  const { chat_id, type, ss } = req.body;
  try {
    const result = await runPersonReport(chat_id, type, ss);
    if (result) {
      res.status(200).send('Report run successfully for user.');
    } else {
      res.status(404).send('User not found.');
    }
  } catch (error) {
    formatError(error, 'Error running report for user:');
    res.status(500).send('Error running report for user.');
  }
});

app.listen(env.BASE_PORT, () => {
  console.log(`API Server running on port ${env.BASE_PORT}`);
});

const reportService = new ReportService(pool);
reportService.startCronJob();