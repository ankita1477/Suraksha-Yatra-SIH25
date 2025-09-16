import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { registerForPushNotificationsAsync, addNotificationResponseListener } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // Initialize push notifications
    const initializeNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log('Push notification token registered:', token);
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();

    // Add notification response listener
    const subscription = addNotificationResponseListener((response) => {
      console.log('Notification response:', response);
      // Handle notification tap here
      const data = response.notification.request.content.data;
      if (data?.emergency) {
        // Navigate to emergency screen or show alert
        console.log('Emergency notification tapped');
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}

