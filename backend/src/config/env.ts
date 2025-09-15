import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  JWT_SECRET: process.env.JWT_SECRET || 'insecure_dev_secret',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/suraksha'
};
