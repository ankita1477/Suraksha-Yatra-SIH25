import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { loginRequest } from '../services/authService';

interface AuthState {
  token: string | null;
  user: { id: string; email: string } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  loading: false,
  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const res = await loginRequest(email, password);
      await SecureStore.setItemAsync('token', res.token);
      set({ token: res.token, user: res.user });
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    set({ token: null, user: null });
  }
}));

export default useAuthStore;
