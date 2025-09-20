import SafeZoneService from '../services/safeZoneService';
import { api } from '../services/api';

// Mock the API
jest.mock('../services/api');
const mockApi = api as jest.Mocked<typeof api>;

describe('SafeZoneService', () => {
  let safeZoneService: SafeZoneService;

  beforeEach(() => {
    safeZoneService = SafeZoneService.getInstance();
    jest.clearAllMocks();
  });

  describe('fetchSafeZones', () => {
    it('should use the centralized API client for authentication', async () => {
      // Mock successful response
      const mockSafeZones = [
        {
          _id: '1',
          name: 'Test Zone',
          center: { lat: 26.943223, lng: 84.3208462 },
          radius: 1000,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
      
      mockApi.get.mockResolvedValue({
        data: { safeZones: mockSafeZones }
      });

      const result = await safeZoneService.fetchSafeZones();

      // Verify API client is used with correct endpoint
      expect(mockApi.get).toHaveBeenCalledWith('/safe-zones');
      expect(result).toEqual(mockSafeZones);
    });

    it('should handle API errors gracefully', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));

      const result = await safeZoneService.fetchSafeZones();

      expect(mockApi.get).toHaveBeenCalledWith('/safe-zones');
      expect(result).toEqual([]);
    });
  });

  describe('checkSafetyStatus', () => {
    it('should use the centralized API client for authentication', async () => {
      const mockSafetyStatus = {
        isInSafeZone: true,
        nearestZone: 'Test Zone',
        distance: 500
      };

      mockApi.post.mockResolvedValue({
        data: mockSafetyStatus
      });

      const lat = 26.943223;
      const lng = 84.3208462;
      const result = await safeZoneService.checkSafetyStatus(lat, lng);

      // Verify API client is used with correct endpoint and payload
      expect(mockApi.post).toHaveBeenCalledWith('/safe-zones/check', {
        lat,
        lng
      });
      expect(result).toEqual(mockSafetyStatus);
    });

    it('should handle API errors gracefully', async () => {
      mockApi.post.mockRejectedValue(new Error('Auth error'));

      const result = await safeZoneService.checkSafetyStatus(26.943223, 84.3208462);

      expect(result).toBeNull();
    });
  });
});