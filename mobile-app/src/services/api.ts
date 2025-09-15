import axios, { AxiosError } from 'axios';
import { getItem, setItem } from '../utils/secureStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Attach access token
api.interceptors.request.use(async (config) => {
  const token = await getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = (async () => {
  const refreshToken = await getItem('refreshToken');
      if (!refreshToken) return null;
      try {
        const res = await axios.post(BASE_URL + '/auth/refresh', { refreshToken });
        const { token, refreshToken: newRefresh } = res.data;
  if (token) await setItem('token', token);
  if (newRefresh) await setItem('refreshToken', newRefresh);
        return token || null;
      } catch {
  await setItem('token', '');
  await setItem('refreshToken', '');
        return null;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  if (error.response?.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      const original = error.config!;
      original.headers = original.headers || {};
      original.headers['Authorization'] = `Bearer ${newToken}`;
      return api.request(original);
    }
  }
  return Promise.reject(error);
});
