// Centralized API configuration for dashboard
export const API_BASE = import.meta.env.VITE_API_BASE || 'https://suraksha-backend-cz74.onrender.com/api';
export const SOCKET_BASE = import.meta.env.VITE_SOCKET_BASE || 'https://suraksha-backend-cz74.onrender.com';

// Helper function to build full API URLs
export function buildApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // If endpoint starts with 'api/', use it directly with base URL
  if (cleanEndpoint.startsWith('api/')) {
    return `${API_BASE.replace('/api', '')}/${cleanEndpoint}`;
  }
  
  // Otherwise append to API_BASE
  return `${API_BASE}/${cleanEndpoint}`;
}

// Common headers helper
export function getAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}