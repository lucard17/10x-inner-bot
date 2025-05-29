import { Pool } from 'pg';
import { getEnv } from '../config/env.config';

const env = getEnv();

const pool = new Pool({
  host: env.PGHOST,
  port: env.PGPORT,
  user: env.PGUSER,
  password: env.PGPASS,
  database: env.PGNAME,
});

export default pool;