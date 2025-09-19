import { api } from './api';
import { AxiosError } from 'axios';

export interface AuthUser { id: string; email: string; role?: string; did?: string }
export interface AuthResponse { token: string; refreshToken: string; user: AuthUser }

function handleAuthError(error: any): never {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.error || 'Request failed';
    
    switch (status) {
      case 409:
        throw new Error('This email is already registered. Please try logging in instead.');
      case 401:
        throw new Error('Invalid email or password. Please check your credentials.');
      case 400:
        throw new Error('Please enter a valid email and password (minimum 6 characters).');
      case 500:
        throw new Error('Server error. Please try again later.');
      default:
        throw new Error(`${message} (Error ${status})`);
    }
  } else if (error.request) {
    throw new Error('Unable to connect to server. Please check your internet connection.');
  } else {
    throw new Error(error.message || 'An unexpected error occurred.');
  }
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  } catch (error) {
    handleAuthError(error);
  }
}

export async function registerRequest(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await api.post('/auth/register', { email, password });
    return res.data;
  } catch (error) {
    handleAuthError(error);
  }
}
