import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  email: { type: String, required: true, index: true, unique: true },
  role: { type: String, enum: ['tourist', 'admin', 'officer'], default: 'tourist' }
}, { timestamps: true });

export const UserModel = model('User', userSchema);
