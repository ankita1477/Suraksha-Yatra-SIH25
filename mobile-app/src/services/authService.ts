import { api } from './api';

export interface AuthUser { id: string; email: string; role?: string; did?: string }
export interface AuthResponse { token: string; refreshToken: string; user: AuthUser }

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function registerRequest(email: string, password: string): Promise<AuthResponse> {
  const res = await api.post('/auth/register', { email, password });
  return res.data;
}
