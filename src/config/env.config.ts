import * as dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  TELEGRAM_TOKEN: string;
  BTLZ_TOKEN: string;
  PASS_CHECKER_URL: string;
  REDIS_HOST: string;
  PGHOST: string;
  PGPORT: number;
  PGUSER: string;
  PGPASS: string;
  PGNAME: string;
  BASE_PORT: number;
  SERVICE_TYPE: string;
  SS_ALL_DATA_URL: string;
  ADMIN_CHAT: string;
}

const env: EnvConfig = {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN || '',
  BTLZ_TOKEN: process.env.BTLZ_TOKEN || '',
  PASS_CHECKER_URL: process.env.PASS_CHECKER_URL || '',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  PGHOST: process.env.PGHOST || 'inner-x10Bot-postgres',
  PGPORT: parseInt(process.env.PGPORT || '5432', 10),
  PGUSER: process.env.PGUSER || '',
  PGPASS: process.env.PGPASS || '',
  PGNAME: process.env.PGNAME || '',
  BASE_PORT: parseInt(process.env.BASE_PORT || '3000', 10),
  SERVICE_TYPE: process.env.SERVICE_TYPE || '',
  SS_ALL_DATA_URL: process.env.SS_ALL_DATA_URL || '',
  ADMIN_CHAT: process.env.ADMIN_CHAT || '',
};

export function getEnv(): EnvConfig {
  for (const [key, value] of Object.entries(env)) {
    if (!value && key !== 'REDIS_HOST' && key !== 'SERVICE_TYPE') {
      throw new Error(`Environment variable ${key} is missing`);
    }
  }
  return env;
}