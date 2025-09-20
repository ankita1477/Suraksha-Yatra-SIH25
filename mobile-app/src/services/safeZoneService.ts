import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { api } from './api';

export interface SafeZone {
  _id: string;
  name: string;
  description?: string;
  center: { lat: number; lng: number };
  radius: number;
  alertThreshold: number;
  isActive: boolean;
  createdAt: string;
}

export interface SafetyStatus {
  withinSafeZone: boolean;
  safeZones: SafeZone[];
  location: { lat: number; lng: number };
}

class SafeZoneService {
  private static instance: SafeZoneService;
  private safeZones: SafeZone[] = [];
  private lastKnownLocation: { lat: number; lng: number } | null = null;
  private safetyCheckInterval: NodeJS.Timeout | null = null;
  private listeners: { onEnter?: (zones: SafeZone[]) => void; onExit?: () => void } = {};
  private lastInside = false;

  static getInstance(): SafeZoneService {
    if (!SafeZoneService.instance) {
      SafeZoneService.instance = new SafeZoneService();
    }
    return SafeZoneService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.fetchSafeZones();
      this.startSafetyMonitoring();
    } catch (error) {
      console.error('Failed to initialize SafeZoneService:', error);
    }
  }

  async fetchSafeZones(): Promise<SafeZone[]> {
    try {
      const response = await api.get('/safe-zones');
      this.safeZones = response.data.safeZones || [];
      return this.safeZones;
    } catch (error) {
      console.error('Error fetching safe zones:', error);
      return [];
    }
  }

  async checkSafetyStatus(latitude: number, longitude: number): Promise<SafetyStatus | null> {
    try {
      const response = await api.post('/safe-zones/check', { 
        lat: latitude, 
        lng: longitude 
      });

      const safetyStatus = response.data;
      this.lastKnownLocation = { lat: latitude, lng: longitude };
      
      return safetyStatus;
    } catch (error) {
      console.error('Error checking safety status:', error);
      return null;
    }
  }

  getSafeZones(): SafeZone[] {
    return this.safeZones;
  }

  getSafeZonesNearLocation(latitude: number, longitude: number, radiusKm: number = 10): SafeZone[] {
    return this.safeZones.filter(zone => {
      const distance = this.calculateDistance(
        latitude, 
        longitude, 
        zone.center.lat, 
        zone.center.lng
      );
      return distance <= radiusKm * 1000; // Convert km to meters
    });
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  isWithinSafeZone(latitude: number, longitude: number): boolean {
    for (const zone of this.safeZones) {
      const distance = this.calculateDistance(
        latitude, 
        longitude, 
        zone.center.lat, 
        zone.center.lng
      );
      if (distance <= zone.radius) {
        return true;
      }
    }
    return false;
  }

  getCurrentSafeZones(latitude: number, longitude: number): SafeZone[] {
    return this.safeZones.filter(zone => {
      const distance = this.calculateDistance(
        latitude, 
        longitude, 
        zone.center.lat, 
        zone.center.lng
      );
      return distance <= zone.radius;
    });
  }

  private startSafetyMonitoring(): void {
    // Check safety status every 30 seconds
    this.safetyCheckInterval = setInterval(() => {
      if (this.lastKnownLocation) {
        this.performSafetyCheck(this.lastKnownLocation.lat, this.lastKnownLocation.lng);
      }
    }, 30000);
  }

  private async performSafetyCheck(latitude: number, longitude: number): Promise<void> {
    const safetyStatus = await this.checkSafetyStatus(latitude, longitude);
    
    if (safetyStatus && !safetyStatus.withinSafeZone) {
      // User is outside safe zones - show local warning
      this.showSafetyWarning();
    }
  }

  private showSafetyWarning(): void {
    Alert.alert(
      '⚠️ Safety Alert',
      'You are currently outside designated safe zones. Please move to a safe area or contact emergency services if needed.',
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'Emergency', 
          style: 'destructive',
          onPress: () => {
            // This could trigger panic alert
            console.log('Emergency button pressed from safety warning');
          }
        }
      ]
    );
  }

  setListeners(listeners: { onEnter?: (zones: SafeZone[]) => void; onExit?: () => void }): void {
    this.listeners = listeners;
  }

  updateLocation(latitude: number, longitude: number): void {
    this.lastKnownLocation = { lat: latitude, lng: longitude };
    // Detect transition client-side without waiting for remote check
    const currentZones = this.getCurrentSafeZones(latitude, longitude);
    const inside = currentZones.length > 0;
    if (!this.lastInside && inside && this.listeners.onEnter) {
      this.listeners.onEnter(currentZones);
    } else if (this.lastInside && !inside && this.listeners.onExit) {
      this.listeners.onExit();
    }
    this.lastInside = inside;
  }

  stopMonitoring(): void {
    if (this.safetyCheckInterval) {
      clearInterval(this.safetyCheckInterval);
      this.safetyCheckInterval = null;
    }
  }

  cleanup(): void {
    this.stopMonitoring();
    this.safeZones = [];
    this.lastKnownLocation = null;
  }
}

export default SafeZoneService;