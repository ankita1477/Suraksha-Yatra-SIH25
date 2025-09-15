import { create } from 'zustand';
import { getItem, setItem, deleteItem } from '../utils/secureStore';
import { loginRequest, registerRequest, AuthUser } from '../services/authService';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  loading: boolean;
  mode: 'login' | 'register';
  toggleMode: () => void;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  loading: false,
  mode: 'login',
  toggleMode: () => set(s => ({ mode: s.mode === 'login' ? 'register' : 'login' })),
  bootstrap: async () => {
  const token = await getItem('token');
  const refreshToken = await getItem('refreshToken');
    if (token) set({ token });
    if (refreshToken) set({ refreshToken });
  },
  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const res = await loginRequest(email, password);
  await setItem('token', res.token);
  await setItem('refreshToken', res.refreshToken);
      set({ token: res.token, refreshToken: res.refreshToken, user: res.user });
    } finally {
      set({ loading: false });
    }
  },
  register: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const res = await registerRequest(email, password);
  await setItem('token', res.token);
  await setItem('refreshToken', res.refreshToken);
      set({ token: res.token, refreshToken: res.refreshToken, user: res.user, mode: 'login' });
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
  await deleteItem('token');
  await deleteItem('refreshToken');
    set({ token: null, refreshToken: null, user: null });
  }
}));

export default useAuthStore;
