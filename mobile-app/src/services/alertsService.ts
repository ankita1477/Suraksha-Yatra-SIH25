import { api } from './api';

interface PanicPayload { lat: number; lng: number; timestamp?: string }

interface IncidentData {
  _id: string;
  type: string;
  severity: string;
  description?: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  userId: string;
  createdAt: string;
  acknowledged?: boolean;
}

export async function sendPanicAlert(payload: PanicPayload) {
  const res = await api.post('/panic', { ...payload, timestamp: payload.timestamp || new Date().toISOString() });
  return res.data;
}

export async function fetchNearbyAlerts(lat: number, lng: number, radiusMeters = 1000) {
  const res = await api.get('/panic-alerts/near', { params: { lat, lng, radiusMeters } });
  return res.data;
}

export async function fetchAllIncidents(limit = 50) {
  try {
    const res = await api.get('/incidents', { params: { limit } });
    return res.data.incidents || [];
  } catch (error) {
    console.error('Failed to fetch incidents:', error);
    return [];
  }
}

export async function fetchRecentPanicAlerts(limit = 20) {
  try {
    const res = await api.get('/panic-alerts', { params: { limit } });
    return res.data.alerts || [];
  } catch (error) {
    console.error('Failed to fetch panic alerts:', error);
    return [];
  }
}

export async function acknowledgeAlert(alertId: string) {
  try {
    const res = await api.post(`/panic-alerts/${alertId}/ack`);
    return res.data;
  } catch (error) {
    console.error('Failed to acknowledge alert:', error);
    throw error;
  }
}

export type { IncidentData, PanicPayload };
