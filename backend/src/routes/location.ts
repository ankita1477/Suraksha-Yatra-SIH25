import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { UserLocationModel } from '../models/UserLocation';
import { IncidentModel } from '../models/Incident';
import { evaluateGeofences } from '../config/geofence';

export const locationRouter = Router();

locationRouter.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { latitude, longitude, speed, accuracy } = req.body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'latitude & longitude required' });
  }
  const userId = req.user!.id;
  const locationDoc = await UserLocationModel.create({
    userId,
    location: { type: 'Point', coordinates: [longitude, latitude] },
    speed, accuracy
  });

  // Simple anomaly: speed > 120 km/h (converted from m/s if provided) or accuracy very low
  let anomaly: string | undefined;
  if (typeof speed === 'number' && speed > 33) { // ~120 km/h
    anomaly = 'unrealistic_speed';
  } else if (typeof accuracy === 'number' && accuracy > 100) {
    anomaly = 'low_gps_accuracy';
  }

  const geofenceHits = evaluateGeofences([longitude, latitude]);
  let incidentCreated;
  if (anomaly || geofenceHits.some(f => f.risk === 'high')) {
    const severity = anomaly ? 'high' : (geofenceHits.some(f=>f.risk==='high') ? 'medium' : 'low');
    incidentCreated = await IncidentModel.create({
      type: anomaly ? 'anomaly' : 'geofence',
      userId,
      severity,
      description: anomaly || `Entered ${geofenceHits.map(f=>f.name).join(', ')}`,
      location: { type: 'Point', coordinates: [longitude, latitude] }
    });
    req.app.get('io')?.emit('incident', incidentCreated);
  }

  res.json({ saved: true, anomaly, geofences: geofenceHits, incident: incidentCreated });
});
