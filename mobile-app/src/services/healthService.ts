import { api } from './api';
import { getApiBaseUrl } from '../config/env';

export interface BackendHealth {
  ok: boolean;
  backendUrl: string;
  status?: any;
  error?: string;
}

export async function checkBackendHealth(): Promise<BackendHealth> {
  const base = await getApiBaseUrl();
  try {
    const res = await api.get('/health');
    return { ok: true, backendUrl: base, status: res.data };
  } catch (e: any) {
    return { ok: false, backendUrl: base, error: e.message };
  }
}

export async function checkAiHealth(): Promise<BackendHealth> {
  const base = await getApiBaseUrl();
  try {
    const res = await api.get('/ai/health');
    return { ok: true, backendUrl: base, status: res.data };
  } catch (e: any) {
    return { ok: false, backendUrl: base, error: e.message };
  }
}

export default { checkBackendHealth, checkAiHealth };