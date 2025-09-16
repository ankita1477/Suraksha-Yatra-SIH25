import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: 'panic' | 'sos' | 'incident' | 'location_share' | 'safety_alert';
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'high' | 'normal';
}

export interface NotificationSettings {
  enabled: boolean;
  panicAlerts: boolean;
  incidentNotifications: boolean;
  locationSharing: boolean;
  safetyAlerts: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  panicAlerts: true,
  incidentNotifications: true,
  locationSharing: true,
  safetyAlerts: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

/**
 * Register device for push notifications
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (!Device.isDevice) {
    console.warn('Must use physical device for Push Notifications');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return null;
  }

  try {
    // Get push token
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push notification token:', token);

    // Store token locally
    await AsyncStorage.setItem('pushToken', token);

    // Configure notification channels for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('emergency', {
        name: 'Emergency Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync('safety', {
        name: 'Safety Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
      });

      await Notifications.setNotificationChannelAsync('general', {
        name: 'General Notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        enableVibrate: true,
      });
    }

    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Send local notification
 */
export async function sendLocalNotification(notification: NotificationData): Promise<string | null> {
  try {
    const settings = await getNotificationSettings();
    
    if (!settings.enabled) {
      console.log('Notifications disabled, skipping local notification');
      return null;
    }

    // Check specific notification type settings
    const shouldSend = checkNotificationTypeEnabled(notification.type, settings);
    if (!shouldSend) {
      console.log(`${notification.type} notifications disabled, skipping`);
      return null;
    }

    const channelId = getChannelId(notification.type);
    const priority = notification.priority === 'high' 
      ? Notifications.AndroidImportance.MAX 
      : Notifications.AndroidImportance.DEFAULT;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: settings.soundEnabled,
        vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
      },
      trigger: null, // Send immediately
    });

    return notificationId;
  } catch (error) {
    console.error('Error sending local notification:', error);
    return null;
  }
}

/**
 * Send emergency notification
 */
export async function sendEmergencyNotification(
  type: 'panic' | 'sos',
  location?: { latitude: number; longitude: number }
): Promise<string | null> {
  const notification: NotificationData = {
    type,
    title: type === 'panic' ? '🆘 PANIC ALERT ACTIVATED' : '🚨 SOS EMERGENCY',
    body: type === 'panic' 
      ? 'Panic button pressed! Emergency contacts have been notified.'
      : 'SOS alert sent! Help is on the way.',
    data: {
      emergency: true,
      alertType: type,
      location,
      timestamp: new Date().toISOString(),
    },
    priority: 'high',
  };

  return await sendLocalNotification(notification);
}

/**
 * Send incident notification
 */
export async function sendIncidentNotification(
  incident: {
    id: string;
    type: string;
    location: { latitude: number; longitude: number };
    distance?: number;
  }
): Promise<string | null> {
  const notification: NotificationData = {
    type: 'incident',
    title: '⚠️ Safety Alert',
    body: `${incident.type} reported ${incident.distance ? `${Math.round(incident.distance)}m` : 'nearby'}. Stay alert!`,
    data: {
      incidentId: incident.id,
      incidentType: incident.type,
      location: incident.location,
      timestamp: new Date().toISOString(),
    },
    priority: 'high',
  };

  return await sendLocalNotification(notification);
}

/**
 * Send location sharing notification
 */
export async function sendLocationShareNotification(
  contactName: string,
  success: boolean
): Promise<string | null> {
  const notification: NotificationData = {
    type: 'location_share',
    title: success ? '📍 Location Shared' : '❌ Location Share Failed',
    body: success 
      ? `Your location has been shared with ${contactName}`
      : `Failed to share location with ${contactName}`,
    data: {
      contactName,
      success,
      timestamp: new Date().toISOString(),
    },
    priority: 'normal',
  };

  return await sendLocalNotification(notification);
}

/**
 * Send safety zone notification
 */
export async function sendSafetyZoneNotification(
  zoneType: 'entered' | 'exited',
  zoneName: string
): Promise<string | null> {
  const notification: NotificationData = {
    type: 'safety_alert',
    title: zoneType === 'entered' ? '✅ Safe Zone Entered' : '⚠️ Safe Zone Exited',
    body: `You have ${zoneType} ${zoneName}`,
    data: {
      zoneType,
      zoneName,
      timestamp: new Date().toISOString(),
    },
    priority: 'normal',
  };

  return await sendLocalNotification(notification);
}

/**
 * Get notification settings
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const settingsJson = await AsyncStorage.getItem('notificationSettings');
    if (settingsJson) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<boolean> {
  try {
    const currentSettings = await getNotificationSettings();
    const newSettings = { ...currentSettings, ...settings };
    
    await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    return true;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return false;
  }
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

/**
 * Get notification history
 */
export async function getNotificationHistory(): Promise<Notifications.Notification[]> {
  try {
    return await Notifications.getPresentedNotificationsAsync();
  } catch (error) {
    console.error('Error getting notification history:', error);
    return [];
  }
}

/**
 * Cancel scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Add notification response listener
 */
export function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Get stored push token
 */
export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('pushToken');
  } catch (error) {
    console.error('Error getting stored push token:', error);
    return null;
  }
}

// Helper functions
function getChannelId(type: NotificationData['type']): string {
  switch (type) {
    case 'panic':
    case 'sos':
      return 'emergency';
    case 'incident':
    case 'safety_alert':
      return 'safety';
    default:
      return 'general';
  }
}

function checkNotificationTypeEnabled(
  type: NotificationData['type'],
  settings: NotificationSettings
): boolean {
  switch (type) {
    case 'panic':
    case 'sos':
      return settings.panicAlerts;
    case 'incident':
      return settings.incidentNotifications;
    case 'location_share':
      return settings.locationSharing;
    case 'safety_alert':
      return settings.safetyAlerts;
    default:
      return true;
  }
}

export default {
  registerForPushNotificationsAsync,
  sendLocalNotification,
  sendEmergencyNotification,
  sendIncidentNotification,
  sendLocationShareNotification,
  sendSafetyZoneNotification,
  getNotificationSettings,
  updateNotificationSettings,
  clearAllNotifications,
  getNotificationHistory,
  cancelNotification,
  addNotificationResponseListener,
  addNotificationReceivedListener,
  getStoredPushToken,
};