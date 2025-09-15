import MockAdapter from 'axios-mock-adapter';
import { api } from '../services/api';
import { sendPanicAlert, fetchNearbyAlerts } from '../services/alertsService';

describe('Alerts Service', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(api);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('sendPanicAlert', () => {
    it('should send panic alert with provided coordinates and timestamp', async () => {
      const payload = {
        lat: 28.6139,
        lng: 77.2090,
        timestamp: '2025-09-16T12:00:00.000Z'
      };

      const mockResponse = {
        id: 'alert-123',
        userId: 'user-456',
        ...payload,
        acknowledged: false,
        createdAt: '2025-09-16T12:00:00.000Z'
      };

      mockAxios.onPost('/panic').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data).toEqual(payload);
        return [201, mockResponse];
      });

      const result = await sendPanicAlert(payload);

      expect(result).toEqual(mockResponse);
      expect(mockAxios.history.post).toHaveLength(1);
      expect(mockAxios.history.post[0].url).toBe('/panic');
    });

    it('should auto-generate timestamp if not provided', async () => {
      const payload = {
        lat: 28.6139,
        lng: 77.2090
      };

      const mockResponse = {
        id: 'alert-123',
        userId: 'user-456',
        lat: payload.lat,
        lng: payload.lng,
        acknowledged: false,
        createdAt: '2025-09-16T12:00:00.000Z'
      };

      mockAxios.onPost('/panic').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.lat).toBe(payload.lat);
        expect(data.lng).toBe(payload.lng);
        expect(data.timestamp).toBeDefined();
        expect(new Date(data.timestamp)).toBeInstanceOf(Date);
        return [201, mockResponse];
      });

      const result = await sendPanicAlert(payload);

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors when sending panic alert', async () => {
      const payload = {
        lat: 28.6139,
        lng: 77.2090
      };

      mockAxios.onPost('/panic').reply(400, {
        error: 'Invalid coordinates'
      });

      await expect(sendPanicAlert(payload)).rejects.toThrow();
    });

    it('should handle network errors when sending panic alert', async () => {
      const payload = {
        lat: 28.6139,
        lng: 77.2090
      };

      mockAxios.onPost('/panic').networkError();

      await expect(sendPanicAlert(payload)).rejects.toThrow('Network Error');
    });

    it('should validate coordinate ranges', async () => {
      // This test ensures the service accepts valid coordinates
      const validPayloads = [
        { lat: -90, lng: -180 }, // Minimum valid
        { lat: 90, lng: 180 },   // Maximum valid
        { lat: 0, lng: 0 },      // Zero coordinates
        { lat: 28.6139, lng: 77.2090 }, // New Delhi
      ];

      for (const payload of validPayloads) {
        mockAxios.reset();
        mockAxios.onPost('/panic').reply(201, { id: 'test', ...payload });
        
        const result = await sendPanicAlert(payload);
        expect(result.lat).toBe(payload.lat);
        expect(result.lng).toBe(payload.lng);
      }
    });
  });

  describe('fetchNearbyAlerts', () => {
    it('should fetch nearby alerts with default radius', async () => {
      const lat = 28.6139;
      const lng = 77.2090;
      const mockAlerts = [
        {
          id: 'alert-1',
          userId: 'user-1',
          lat: 28.6140,
          lng: 77.2091,
          distance: 15.2,
          acknowledged: false,
          createdAt: '2025-09-16T11:30:00.000Z'
        },
        {
          id: 'alert-2',
          userId: 'user-2',
          lat: 28.6145,
          lng: 77.2085,
          distance: 67.8,
          acknowledged: true,
          createdAt: '2025-09-16T11:25:00.000Z'
        }
      ];

      mockAxios.onGet('/panic-alerts/near').reply((config) => {
        expect(config.params.lat).toBe(lat);
        expect(config.params.lng).toBe(lng);
        expect(config.params.radiusMeters).toBe(1000); // Default radius
        return [200, mockAlerts];
      });

      const result = await fetchNearbyAlerts(lat, lng);

      expect(result).toEqual(mockAlerts);
      expect(mockAxios.history.get).toHaveLength(1);
      expect(mockAxios.history.get[0].url).toBe('/panic-alerts/near');
    });

    it('should fetch nearby alerts with custom radius', async () => {
      const lat = 28.6139;
      const lng = 77.2090;
      const radiusMeters = 500;
      const mockAlerts: any[] = [];

      mockAxios.onGet('/panic-alerts/near').reply((config) => {
        expect(config.params.lat).toBe(lat);
        expect(config.params.lng).toBe(lng);
        expect(config.params.radiusMeters).toBe(radiusMeters);
        return [200, mockAlerts];
      });

      const result = await fetchNearbyAlerts(lat, lng, radiusMeters);

      expect(result).toEqual(mockAlerts);
    });

    it('should handle empty results', async () => {
      const lat = 28.6139;
      const lng = 77.2090;

      mockAxios.onGet('/panic-alerts/near').reply(200, []);

      const result = await fetchNearbyAlerts(lat, lng);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle API errors when fetching nearby alerts', async () => {
      const lat = 28.6139;
      const lng = 77.2090;

      mockAxios.onGet('/panic-alerts/near').reply(500, {
        error: 'Internal server error'
      });

      await expect(fetchNearbyAlerts(lat, lng)).rejects.toThrow();
    });

    it('should handle authentication errors', async () => {
      const lat = 28.6139;
      const lng = 77.2090;

      mockAxios.onGet('/panic-alerts/near').reply(401, {
        error: 'Unauthorized'
      });

      await expect(fetchNearbyAlerts(lat, lng)).rejects.toThrow();
    });

    it('should validate query parameters', async () => {
      const testCases = [
        { lat: 0, lng: 0, radiusMeters: 100 },
        { lat: -90, lng: -180, radiusMeters: 2000 },
        { lat: 90, lng: 180, radiusMeters: 5000 },
      ];

      for (const testCase of testCases) {
        mockAxios.reset();
        mockAxios.onGet('/panic-alerts/near').reply(200, []);
        
        await fetchNearbyAlerts(testCase.lat, testCase.lng, testCase.radiusMeters);
        
        const request = mockAxios.history.get[0];
        expect(request.params.lat).toBe(testCase.lat);
        expect(request.params.lng).toBe(testCase.lng);
        expect(request.params.radiusMeters).toBe(testCase.radiusMeters);
      }
    });
  });
});