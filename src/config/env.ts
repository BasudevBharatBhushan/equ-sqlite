import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || 18273,
  ALLOW_WRITE_QUERIES: process.env.ALLOW_WRITE_QUERIES === 'true',
  DB_PATH: process.env.DB_PATH || (process.platform === 'win32' ? 'reporting.db' : '/app/data/reporting.db'),
};
