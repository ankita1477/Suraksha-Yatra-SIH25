import mongoose from 'mongoose';
import { ENV } from './env';

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(ENV.MONGODB_URI, { autoIndex: true });
  console.log('MongoDB connected');
}
