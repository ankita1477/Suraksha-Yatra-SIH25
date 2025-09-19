import { create } from 'zustand';
import { getItem, setItem, deleteItem } from '../utils/secureStore';
import { loginRequest, registerRequest, AuthUser } from '../services/authService';
import { api } from '../services/api';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
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
  isAuthenticated: false,
  mode: 'login',
  toggleMode: () => set(s => ({ mode: s.mode === 'login' ? 'register' : 'login' })),
  bootstrap: async () => {
    try {
      set({ loading: true });
      const token = await getItem('token');
      const refreshToken = await getItem('refreshToken');
      const userStr = await getItem('user');
      
      if (token && refreshToken) {
        // Try to validate the token by making a test request
        try {
          // Set the token temporarily to test it
          set({ token, refreshToken });
          
          // Make a test request to validate the token
          const response = await api.get('/auth/me');
          const user = response.data.user;
          
          // If successful, set authenticated state
          set({ 
            token, 
            refreshToken, 
            user, 
            isAuthenticated: true 
          });
          
          // Store user data
          await setItem('user', JSON.stringify(user));
          console.log('Authentication restored successfully');
        } catch (error) {
          console.log('Stored token is invalid, clearing auth state');
          // Token is invalid, clear everything
          await deleteItem('token');
          await deleteItem('refreshToken');
          await deleteItem('user');
          set({ 
            token: null, 
            refreshToken: null, 
            user: null, 
            isAuthenticated: false 
          });
        }
      } else if (userStr && token) {
        // Fallback: restore from stored user data if available
        try {
          const user = JSON.parse(userStr);
          set({ 
            token, 
            refreshToken, 
            user, 
            isAuthenticated: true 
          });
        } catch (error) {
          console.error('Failed to parse stored user data');
        }
      }
    } catch (error) {
      console.error('Failed to bootstrap auth:', error);
    } finally {
      set({ loading: false });
    }
  },
  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const res = await loginRequest(email, password);
      await setItem('token', res.token);
      await setItem('refreshToken', res.refreshToken);
      await setItem('user', JSON.stringify(res.user));
      set({ 
        token: res.token, 
        refreshToken: res.refreshToken, 
        user: res.user, 
        isAuthenticated: true 
      });
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
      await setItem('user', JSON.stringify(res.user));
      set({ 
        token: res.token, 
        refreshToken: res.refreshToken, 
        user: res.user, 
        isAuthenticated: true,
        mode: 'login' 
      });
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    try {
      await deleteItem('token');
      await deleteItem('refreshToken');
      await deleteItem('user');
      set({ 
        token: null, 
        refreshToken: null, 
        user: null, 
        isAuthenticated: false 
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still reset state even if deletion fails
      set({ 
        token: null, 
        refreshToken: null, 
        user: null, 
        isAuthenticated: false 
      });
    }
  }
}));

export default useAuthStore;
