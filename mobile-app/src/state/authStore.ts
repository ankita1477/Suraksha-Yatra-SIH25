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
      
      if (token && refreshToken && userStr) {
        // Try to validate the token by making a test request (with timeout)
        try {
          // Set the token temporarily to test it
          set({ token, refreshToken });
          
          // Try to parse stored user data first
          const storedUser = JSON.parse(userStr);
          
          // Make a test request to validate the token (with shorter timeout)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('API request timeout')), 5000)
          );
          
          const apiRequest = api.get('/auth/me');
          const response: any = await Promise.race([apiRequest, timeoutPromise]);
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
          console.log('Authentication restored successfully with API validation');
        } catch (error: any) {
          console.log('API validation failed, using stored user data:', error?.message || 'Unknown error');
          
          // If API fails but we have stored user data, use it
          try {
            const user = JSON.parse(userStr);
            set({ 
              token, 
              refreshToken, 
              user, 
              isAuthenticated: true 
            });
            console.log('Authentication restored from stored data (offline mode)');
          } catch (parseError) {
            console.error('Failed to parse stored user data:', parseError);
            // Clear all auth data if user data is corrupted
            try {
              await deleteItem('token');
              await deleteItem('refreshToken');
              await deleteItem('user');
            } catch (deleteError) {
              console.error('Error clearing auth data:', deleteError);
            }
            set({ 
              token: null, 
              refreshToken: null, 
              user: null, 
              isAuthenticated: false 
            });
          }
        }
      } else if (token || refreshToken || userStr) {
        // Partial auth data found, clear everything for consistency
        console.log('Partial auth data found, clearing for consistency');
        try {
          await deleteItem('token');
          await deleteItem('refreshToken');
          await deleteItem('user');
        } catch (deleteError) {
          console.error('Error clearing partial auth data:', deleteError);
        }
        set({ 
          token: null, 
          refreshToken: null, 
          user: null, 
          isAuthenticated: false 
        });
      } else {
        // No stored credentials, user is not authenticated
        set({ 
          token: null, 
          refreshToken: null, 
          user: null, 
          isAuthenticated: false 
        });
        console.log('No stored authentication found');
      }
    } catch (error) {
      console.error('Failed to bootstrap auth:', error);
      // Ensure we set a safe state even if bootstrap fails
      set({ 
        token: null, 
        refreshToken: null, 
        user: null, 
        isAuthenticated: false 
      });
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
