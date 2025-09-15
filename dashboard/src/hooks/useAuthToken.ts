import { useState, useEffect } from 'react';

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { setToken(localStorage.getItem('dash_token')); }, []);
  return { token, setToken: (t: string | null) => { if (!t) localStorage.removeItem('dash_token'); else localStorage.setItem('dash_token', t); setToken(t); } };
}
