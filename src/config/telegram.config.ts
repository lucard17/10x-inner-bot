import { getEnv } from './env.config';

const env = getEnv();

export const telegramApi = {
  send: {
    photo: `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendPhoto`,
    message: `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`,
    editMessageMedia: `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/editMessageMedia`,
  },
};

export const btlzApi = {
  report: (spreadsheetId: string) => `https://mp.btlz-api.ru/api/admin/ss/${spreadsheetId}/values`,
  reportBody: { sheet_name: 'Отчёт Telegram', value_render_option: 'FORMATTED_VALUE' },
  token: env.BTLZ_TOKEN,
};