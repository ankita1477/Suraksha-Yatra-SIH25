import { api } from './api';

interface PanicPayload {
  lat: number;
  lng: number;
  timestamp: string;
}

export async function sendPanicAlert(payload: PanicPayload) {
  // Mock – replace with real API call
  await new Promise(r => setTimeout(r, 600));
  return { status: 'ok' };
}
