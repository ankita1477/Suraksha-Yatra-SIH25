import axios, { AxiosResponse } from 'axios';

// Placeholder base URL - replace with your backend URL or env config
export const api = axios.create({
  baseURL: 'https://example-backend.local/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (error: any) => {
    // Basic centralized error handling (extend later)
    return Promise.reject(error);
  }
);
