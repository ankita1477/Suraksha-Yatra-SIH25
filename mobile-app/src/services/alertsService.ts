import { api } from './api';

interface PanicPayload { lat: number; lng: number; timestamp?: string }

export async function sendPanicAlert(payload: PanicPayload) {
  const res = await api.post('/panic', { ...payload, timestamp: payload.timestamp || new Date().toISOString() });
  return res.data;
}

export async function fetchNearbyAlerts(lat: number, lng: number, radiusMeters = 1000) {
  const res = await api.get('/panic-alerts/near', { params: { lat, lng, radiusMeters } });
  return res.data;
}
