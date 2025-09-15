import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/authorize';
import type { Server } from 'socket.io';
import { PanicAlertPayload } from '../types';
import { PanicAlertModel } from '../models/PanicAlert';

export function createPanicRouter(io: Server) {
  const router = Router();

  const panicSchema = z.object({
    lat: z.number().refine(v => Math.abs(v) <= 90, 'invalid latitude'),
    lng: z.number().refine(v => Math.abs(v) <= 180, 'invalid longitude'),
    timestamp: z.string().optional()
  });

  router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    const parse = panicSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: 'Invalid input', issues: parse.error.issues });
    const { lat, lng } = parse.data;
    const payload: PanicAlertPayload = {
      lat,
      lng,
      timestamp: parse.data.timestamp || new Date().toISOString(),
      userId: req.user!.id
    };
    // Persist to Mongo
    await PanicAlertModel.create({
      userId: payload.userId,
      lat: payload.lat,
      lng: payload.lng,
      timestamp: payload.timestamp,
      location: { type: 'Point', coordinates: [payload.lng, payload.lat] }
    });
    io.emit('panic_alert', payload);
    res.status(201).json({ status: 'ok', alert: payload });
  });

  return router;
}

export function createPanicQueryRouter() {
  const router = Router();
  router.get('/', authMiddleware, async (_req: AuthRequest, res) => {
    const recent = await PanicAlertModel.find({}).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ alerts: recent });
  });
  router.get('/near', authMiddleware, async (req: AuthRequest, res) => {
    const { lat, lng, radiusMeters = 1000 } = req.query as any;
    if (!lat || !lng) return res.status(400).json({ error: 'lat & lng required' });
    const radius = Number(radiusMeters) / 6378137; // radians earth radius
    const docs = await PanicAlertModel.find({
      location: { $geoWithin: { $centerSphere: [[Number(lng), Number(lat)], radius] } }
    }).limit(100).lean();
    res.json({ alerts: docs });
  });
  router.post('/:id/ack', authMiddleware, requireRole('officer','admin'), async (req: AuthRequest, res) => {
    const { id } = req.params;
    const updated = await PanicAlertModel.findByIdAndUpdate(id, { acknowledged: true, acknowledgedBy: req.user!.id }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ alert: updated });
  });
  return router;
}
