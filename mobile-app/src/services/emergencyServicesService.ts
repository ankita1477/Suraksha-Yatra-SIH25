import { config } from '../config/env';

export interface EmergencyService {
  id: string;
  name: string;
  phoneNumber: string;
  serviceType: 'police' | 'hospital' | 'fire' | 'tourist_helpline' | 'other';
  address: string;
  city: string;
  state: string;
  isActive: boolean;
  availableHours: string;
  description?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyServicesResponse {
  success: boolean;
  message: string;
  data: {
    services: EmergencyService[];
  };
}

class EmergencyServicesService {
  async getEmergencyServices(): Promise<EmergencyService[]> {
    try {
      const response = await fetch(`${config.apiBaseUrl}/emergency-services`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: EmergencyServicesResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch emergency services');
      }

      return data.data.services || [];
    } catch (error) {
      console.error('Error fetching emergency services:', error);
      throw error;
    }
  }

  async getEmergencyServicesByLocation(latitude: number, longitude: number, maxDistance: number = 50000): Promise<EmergencyService[]> {
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/emergency-services/nearby/${latitude}/${longitude}?maxDistance=${maxDistance}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: EmergencyServicesResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch nearby emergency services');
      }

      return data.data.services || [];
    } catch (error) {
      console.error('Error fetching nearby emergency services:', error);
      throw error;
    }
  }

  async getEmergencyServicesByType(serviceType: string): Promise<EmergencyService[]> {
    try {
      const response = await fetch(`${config.apiBaseUrl}/emergency-services?serviceType=${serviceType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: EmergencyServicesResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch emergency services by type');
      }

      return data.data.services || [];
    } catch (error) {
      console.error('Error fetching emergency services by type:', error);
      throw error;
    }
  }
}

export const emergencyServicesService = new EmergencyServicesService();