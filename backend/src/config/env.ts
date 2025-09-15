import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  JWT_SECRET: process.env.JWT_SECRET || 'insecure_dev_secret',
  DATABASE_URL: process.env.DATABASE_URL || ''
};
