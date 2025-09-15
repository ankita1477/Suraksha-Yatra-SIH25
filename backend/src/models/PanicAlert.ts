import { Schema, model } from 'mongoose';

const panicAlertSchema = new Schema({
  userId: { type: String, required: true, index: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  timestamp: { type: Date, default: () => new Date(), index: true }
}, { timestamps: true });

panicAlertSchema.index({ lat: 1, lng: 1 });

export const PanicAlertModel = model('PanicAlert', panicAlertSchema);
