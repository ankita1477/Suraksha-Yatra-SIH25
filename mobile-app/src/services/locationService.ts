import { api } from './api';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Alert } from 'react-native';

export interface LocationUpdatePayload {
  latitude: number; longitude: number; speed?: number; accuracy?: number;
}

export interface LocationResponse {
  saved: boolean; 
  anomaly?: string; 
  geofences?: any[];
  timestamp?: string;
}

// Background task name
const LOCATION_TASK_NAME = 'background-location-task';

// Location tracking state
let locationSubscription: Location.LocationSubscription | null = null;
let isTrackingActive = false;

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }: any) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const location = locations[0];
      console.log('Background location update:', location);
      // Send location update to backend
      sendLocationUpdate({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        speed: location.coords.speed || undefined,
        accuracy: location.coords.accuracy || undefined,
      }).catch(err => console.error('Failed to send background location:', err));
    }
  }
});

export async function sendLocationUpdate(payload: LocationUpdatePayload): Promise<LocationResponse> {
  try {
    const res = await api.post('/location', payload);
    return res.data as LocationResponse;
  } catch (error) {
    console.error('Location update failed:', error);
    throw error;
  }
}

export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'This app needs location access to provide safety monitoring and emergency services.',
        [{ text: 'OK' }]
      );
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    if (backgroundStatus !== 'granted') {
      Alert.alert(
        'Background Location',
        'For continuous safety monitoring, please allow location access "Always" in settings.',
        [{ text: 'OK' }]
      );
    }

    return true;
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return false;
  }
}

export async function startLocationTracking(
  onLocationUpdate?: (location: Location.LocationObject, response: LocationResponse) => void,
  options: {
    accuracy?: Location.Accuracy;
    timeInterval?: number;
    distanceInterval?: number;
  } = {}
): Promise<boolean> {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return false;

    // Default options
    const trackingOptions = {
      accuracy: options.accuracy || Location.Accuracy.Balanced,
      timeInterval: options.timeInterval || 30000, // 30 seconds
      distanceInterval: options.distanceInterval || 100, // 100 meters
    };

    // Stop existing tracking
    if (isTrackingActive) {
      await stopLocationTracking();
    }

    // Start foreground location tracking
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: trackingOptions.accuracy,
        timeInterval: trackingOptions.timeInterval,
        distanceInterval: trackingOptions.distanceInterval,
      },
      async (location) => {
        try {
          const payload = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            speed: location.coords.speed || undefined,
            accuracy: location.coords.accuracy || undefined,
          };

          const response = await sendLocationUpdate(payload);
          
          // Check for anomalies
          if (response.anomaly) {
            Alert.alert(
              '⚠️ Safety Alert',
              `Anomaly detected: ${response.anomaly}`,
              [{ text: 'OK' }]
            );
          }

          // Check for geofence alerts
          if (response.geofences && response.geofences.length > 0) {
            const zones = response.geofences.map(g => g.name).join(', ');
            console.log(`Entered zones: ${zones}`);
          }

          // Call callback if provided
          if (onLocationUpdate) {
            onLocationUpdate(location, response);
          }
        } catch (error) {
          console.error('Error processing location update:', error);
        }
      }
    );

    // Start background location tracking
    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000, // 1 minute for background
        distanceInterval: 200, // 200 meters for background
        deferredUpdatesInterval: 60000,
        showsBackgroundLocationIndicator: true,
      });
    } catch (backgroundError) {
      console.warn('Background location not available:', backgroundError);
    }

    isTrackingActive = true;
    console.log('Location tracking started successfully');
    return true;
  } catch (error) {
    console.error('Error starting location tracking:', error);
    return false;
  }
}

export async function stopLocationTracking(): Promise<void> {
  try {
    // Stop foreground tracking
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }

    // Stop background tracking
    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isTaskRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }

    isTrackingActive = false;
    console.log('Location tracking stopped');
  } catch (error) {
    console.error('Error stopping location tracking:', error);
  }
}

export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return location;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

export function isLocationTrackingActive(): boolean {
  return isTrackingActive;
}

export async function getLocationStatus(): Promise<{
  hasPermission: boolean;
  isTracking: boolean;
  backgroundEnabled: boolean;
}> {
  try {
    const foregroundStatus = await Location.getForegroundPermissionsAsync();
    const backgroundStatus = await Location.getBackgroundPermissionsAsync();
    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);

    return {
      hasPermission: foregroundStatus.status === 'granted',
      isTracking: isTrackingActive,
      backgroundEnabled: backgroundStatus.status === 'granted' && isTaskRegistered,
    };
  } catch (error) {
    console.error('Error getting location status:', error);
    return {
      hasPermission: false,
      isTracking: false,
      backgroundEnabled: false,
    };
  }
}