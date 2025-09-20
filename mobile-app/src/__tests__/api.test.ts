import MockAdapter from 'axios-mock-adapter';
import { api } from '../services/api';
import * as SecureStore from '../utils/secureStore';

// Mock SecureStore functions
jest.mock('../utils/secureStore', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('API Service', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(api);
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('Request Interceptor', () => {
    it('should attach authorization header when token exists', async () => {
      const token = 'test-token';
      mockSecureStore.getItem.mockResolvedValue(token);
      
      mockAxios.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBe(`Bearer ${token}`);
        return [200, { success: true }];
      });

      await api.get('/test');
      expect(mockSecureStore.getItem).toHaveBeenCalledWith('token');
    });

    it('should not attach authorization header when token does not exist', async () => {
      mockSecureStore.getItem.mockResolvedValue(null);
      
      mockAxios.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBeUndefined();
        return [200, { success: true }];
      });

      await api.get('/test');
      expect(mockSecureStore.getItem).toHaveBeenCalledWith('token');
    });
  });

  describe('Response Interceptor - Token Refresh', () => {
    it('should refresh token and retry request on 401 error', async () => {
      const oldToken = 'old-token';
      const newToken = 'new-token';
      const refreshToken = 'refresh-token';

      mockSecureStore.getItem
        .mockResolvedValueOnce(oldToken) // Initial request
        .mockResolvedValueOnce(refreshToken) // Refresh attempt
        .mockResolvedValueOnce(newToken); // Retry request

      // First request fails with 401
      mockAxios.onGet('/protected').replyOnce(401);
      
      // Refresh token request succeeds
      mockAxios.onPost('/auth/refresh').replyOnce(200, {
        token: newToken,
        refreshToken: 'new-refresh-token'
      });
      
      // Second request to same endpoint succeeds
      mockAxios.onGet('/protected').replyOnce(200, { data: 'success' });

      const response = await api.get('/protected');

      expect(response.data).toEqual({ data: 'success' });
      expect(mockSecureStore.setItem).toHaveBeenCalledWith('token', newToken);
      expect(mockSecureStore.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh-token');
    });

    it('should clear tokens when refresh fails', async () => {
      const oldToken = 'old-token';
      const refreshToken = 'invalid-refresh-token';

      mockSecureStore.getItem
        .mockResolvedValueOnce(oldToken) // Initial request
        .mockResolvedValueOnce(refreshToken); // Refresh attempt

      // First request fails with 401
      mockAxios.onGet('/protected').replyOnce(401);
      
      // Refresh token request fails
      mockAxios.onPost('/auth/refresh').reply(401);

      try {
        await api.get('/protected');
      } catch (error) {
        // Should throw the original 401 error
        expect(error).toBeDefined();
      }

      expect(mockSecureStore.setItem).toHaveBeenCalledWith('token', '');
      expect(mockSecureStore.setItem).toHaveBeenCalledWith('refreshToken', '');
    });

    it('should handle missing refresh token', async () => {
      const oldToken = 'old-token';

      mockSecureStore.getItem
        .mockResolvedValueOnce(oldToken) // Initial request
        .mockResolvedValueOnce(null); // No refresh token

      // First request fails with 401
      mockAxios.onGet('/protected').replyOnce(401);

      try {
        await api.get('/protected');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Should not attempt refresh
      expect(mockAxios.history.post).toHaveLength(0);
    });
  });

  describe('API Configuration', () => {
    it('should have correct base URL', () => {
      expect(api.defaults.baseURL).toBe('https://suraksha-backend-cz74.onrender.com/api');
    });

    it('should have correct timeout', () => {
      expect(api.defaults.timeout).toBe(15000);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockAxios.onGet('/test').networkError();

      try {
        await api.get('/test');
      } catch (error: any) {
        expect(error.message).toBe('Network Error');
      }
    });

    it('should handle timeout errors', async () => {
      mockAxios.onGet('/test').timeout();

      try {
        await api.get('/test');
      } catch (error: any) {
        expect(error.code).toBe('ECONNABORTED');
      }
    });
  });
});