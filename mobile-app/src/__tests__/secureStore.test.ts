import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getItem, setItem, deleteItem } from '../utils/secureStore';

// Mock Expo SecureStore
jest.mock('expo-secure-store');
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios', // Default to native platform
  },
}));

describe('SecureStore Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Platform to native by default
    (Platform as any).OS = 'ios';
    
    // Clear and setup localStorage mock
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  describe('getItem', () => {
    it('should get item from SecureStore on native platforms', async () => {
      const key = 'test-key';
      const value = 'test-value';
      
      mockSecureStore.getItemAsync.mockResolvedValue(value);

      const result = await getItem(key);

      expect(result).toBe(value);
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(key);
      expect(localStorage.getItem).not.toHaveBeenCalled();
    });

    it('should get item from localStorage on web platform', async () => {
      (Platform as any).OS = 'web';
      const key = 'test-key';
      const value = 'test-value';
      
      (localStorage.getItem as jest.Mock).mockReturnValue(value);

      const result = await getItem(key);

      expect(result).toBe(value);
      expect(localStorage.getItem).toHaveBeenCalledWith(key);
      expect(mockSecureStore.getItemAsync).not.toHaveBeenCalled();
    });

    it('should return null when SecureStore throws error', async () => {
      const key = 'test-key';
      
      mockSecureStore.getItemAsync.mockRejectedValue(new Error('SecureStore error'));

      const result = await getItem(key);

      expect(result).toBeNull();
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(key);
    });

    it('should return null when localStorage is not available on web', async () => {
      (Platform as any).OS = 'web';
      const key = 'test-key';
      
      // Remove localStorage
      delete (window as any).localStorage;

      const result = await getItem(key);

      expect(result).toBeNull();
    });

    it('should return null when localStorage throws error', async () => {
      (Platform as any).OS = 'web';
      const key = 'test-key';
      
      (localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = await getItem(key);

      expect(result).toBeNull();
    });

    it('should return null for non-existent items', async () => {
      const key = 'non-existent-key';
      
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const result = await getItem(key);

      expect(result).toBeNull();
    });
  });

  describe('setItem', () => {
    it('should set item in SecureStore on native platforms', async () => {
      const key = 'test-key';
      const value = 'test-value';
      
      mockSecureStore.setItemAsync.mockResolvedValue(undefined);

      await setItem(key, value);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(key, value);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should set item in localStorage on web platform', async () => {
      (Platform as any).OS = 'web';
      const key = 'test-key';
      const value = 'test-value';

      await setItem(key, value);

      expect(localStorage.setItem).toHaveBeenCalledWith(key, value);
      expect(mockSecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('should handle SecureStore errors silently', async () => {
      const key = 'test-key';
      const value = 'test-value';
      
      mockSecureStore.setItemAsync.mockRejectedValue(new Error('SecureStore error'));

      // Should not throw
      await expect(setItem(key, value)).resolves.toBeUndefined();
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(key, value);
    });

    it('should handle localStorage errors silently on web', async () => {
      (Platform as any).OS = 'web';
      const key = 'test-key';
      const value = 'test-value';
      
      (localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw
      await expect(setItem(key, value)).resolves.toBeUndefined();
    });

    it('should handle missing localStorage on web', async () => {
      (Platform as any).OS = 'web';
      const key = 'test-key';
      const value = 'test-value';
      
      // Remove localStorage
      delete (window as any).localStorage;

      // Should not throw
      await expect(setItem(key, value)).resolves.toBeUndefined();
    });
  });

  describe('deleteItem', () => {
    it('should delete item from SecureStore on native platforms', async () => {
      const key = 'test-key';
      
      mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);

      await deleteItem(key);

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(key);
      expect(localStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should delete item from localStorage on web platform', async () => {
      (Platform as any).OS = 'web';
      const key = 'test-key';

      await deleteItem(key);

      expect(localStorage.removeItem).toHaveBeenCalledWith(key);
      expect(mockSecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });

    it('should handle SecureStore errors silently', async () => {
      const key = 'test-key';
      
      mockSecureStore.deleteItemAsync.mockRejectedValue(new Error('SecureStore error'));

      // Should not throw
      await expect(deleteItem(key)).resolves.toBeUndefined();
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(key);
    });

    it('should handle localStorage errors silently on web', async () => {
      (Platform as any).OS = 'web';
      const key = 'test-key';
      
      (localStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw
      await expect(deleteItem(key)).resolves.toBeUndefined();
    });

    it('should handle missing localStorage on web', async () => {
      (Platform as any).OS = 'web';
      const key = 'test-key';
      
      // Remove localStorage
      delete (window as any).localStorage;

      // Should not throw
      await expect(deleteItem(key)).resolves.toBeUndefined();
    });
  });

  describe('Cross-platform consistency', () => {
    it('should maintain consistent API across platforms', async () => {
      const key = 'test-key';
      const value = 'test-value';

      // Test native platform
      (Platform as any).OS = 'ios';
      mockSecureStore.setItemAsync.mockResolvedValue(undefined);
      mockSecureStore.getItemAsync.mockResolvedValue(value);
      mockSecureStore.deleteItemAsync.mockResolvedValue(undefined);

      await setItem(key, value);
      const nativeResult = await getItem(key);
      await deleteItem(key);

      expect(nativeResult).toBe(value);

      // Test web platform
      (Platform as any).OS = 'web';
      (localStorage.setItem as jest.Mock).mockReturnValue(undefined);
      (localStorage.getItem as jest.Mock).mockReturnValue(value);
      (localStorage.removeItem as jest.Mock).mockReturnValue(undefined);

      await setItem(key, value);
      const webResult = await getItem(key);
      await deleteItem(key);

      expect(webResult).toBe(value);
      expect(nativeResult).toBe(webResult);
    });
  });
});