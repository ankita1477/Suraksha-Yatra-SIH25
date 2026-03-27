import axios, { AxiosError } from 'axios';
import { getItem, setItem, deleteItem } from '../utils/secureStore';
import { config, log } from '../config/env';

let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export function setUnauthorizedHandler(handler: (() => void | Promise<void>) | null) {
  unauthorizedHandler = handler;
}

export const api = axios.create({
  baseURL: config.apiBaseUrl,
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
        const res = await axios.post(config.apiBaseUrl + '/auth/refresh', { refreshToken });
        const { token, refreshToken: newRefresh } = res.data;
        if (token) await setItem('token', token);
        if (newRefresh) await setItem('refreshToken', newRefresh);
        return token || null;
      } catch {
        await deleteItem('token');
        await deleteItem('refreshToken');
        await deleteItem('user');
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

    if (unauthorizedHandler) {
      await unauthorizedHandler();
    }
  }
  return Promise.reject(error);
});
