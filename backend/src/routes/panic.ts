import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
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
      timestamp: payload.timestamp
    });
    io.emit('panic_alert', payload);
    res.status(201).json({ status: 'ok', alert: payload });
  });

  return router;
}
