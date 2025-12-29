import * as dotenv from "dotenv";
dotenv.config();

export const btlz_api = {
  report: (ss: string) => {
    return `https://mp.btlz-api.ru/api/admin/ss/${ss}/values`;
  },
  reportBody: {
    sheet_name: "Отчёт Telegram",
    value_render_option: "FORMATTED_VALUE",
  },
  spreadsheet: (ss: string) => {
    return `https://mp.btlz-api.ru/api/admin/ss/${ss}`;
  },
  token: process.env.BTLZ_TOKEN,
};

export const tg_api = {
  send: {
    photo: `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendPhoto`,
    message: `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
  },
};
