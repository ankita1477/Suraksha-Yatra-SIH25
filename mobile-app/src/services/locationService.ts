import { api } from './api';

export interface LocationUpdatePayload {
  latitude: number; longitude: number; speed?: number; accuracy?: number;
}

export async function sendLocationUpdate(p: LocationUpdatePayload) {
  const res = await api.post('/location', p);
  return res.data as { saved: boolean; anomaly?: string; geofences?: any[] };
}