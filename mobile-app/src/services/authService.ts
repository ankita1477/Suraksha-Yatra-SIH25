import { api } from './api';

export interface LoginResponse {
  token: string;
  user: { id: string; email: string };
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  // Mocked for MVP – replace with real endpoint
  await new Promise(r => setTimeout(r, 800));
  if (!email || !password) throw new Error('Email & password required');
  return { token: 'mock-token', user: { id: 'u1', email } };
}
