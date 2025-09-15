import { Schema, model } from 'mongoose';

const panicAlertSchema = new Schema({
  userId: { type: String, required: true, index: true },
  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true, index: '2dsphere' } },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  timestamp: { type: Date, default: () => new Date(), index: true },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: { type: String }
}, { timestamps: true });

panicAlertSchema.index({ createdAt: -1 });

export const PanicAlertModel = model('PanicAlert', panicAlertSchema);
