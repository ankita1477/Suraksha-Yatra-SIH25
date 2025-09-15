import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { IncidentModel } from '../models/Incident';
import { requireRole } from '../middleware/authorize';

export const incidentsRouter = Router();

incidentsRouter.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const filter: any = {};
  if (req.query.status) filter.status = req.query.status;
  const incidents = await IncidentModel.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json(incidents);
});

incidentsRouter.post('/:id/ack', authMiddleware, requireRole('officer','admin'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const incident = await IncidentModel.findByIdAndUpdate(id, { status: 'acknowledged' }, { new: true });
  if (!incident) return res.status(404).json({ error: 'Not found' });
  res.json(incident);
});

incidentsRouter.post('/:id/resolve', authMiddleware, requireRole('officer','admin'), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const incident = await IncidentModel.findByIdAndUpdate(id, { status: 'resolved' }, { new: true });
  if (!incident) return res.status(404).json({ error: 'Not found' });
  res.json(incident);
});
