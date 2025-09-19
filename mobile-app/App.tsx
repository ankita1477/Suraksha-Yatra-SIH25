import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { registerForPushNotificationsAsync, addNotificationResponseListener } from './src/services/notificationService';
import useAuthStore from './src/state/authStore';

export default function App() {
  const bootstrap = useAuthStore(state => state.bootstrap);

  useEffect(() => {
    // Initialize authentication state first
    const initializeApp = async () => {
      try {
        console.log('Starting app initialization...');
        // Bootstrap auth state (check for stored tokens)
        await bootstrap();
        console.log('Auth bootstrap completed');
        
        // Initialize push notifications after auth
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            console.log('Push notification token registered:', token);
          }
        } catch (notificationError) {
          console.warn('Push notification setup failed:', notificationError);
          // Don't crash the app if notifications fail
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Ensure the app doesn't crash on initialization failure
      }
    };

    initializeApp();

    // Add notification response listener
    let subscription: any = null;
    try {
      subscription = addNotificationResponseListener((response) => {
        console.log('Notification response:', response);
        // Handle notification tap here
        const data = response.notification.request.content.data;
        if (data?.emergency) {
          // Navigate to emergency screen or show alert
          console.log('Emergency notification tapped');
        }
      });
    } catch (error) {
      console.warn('Failed to set up notification listener:', error);
    }

    return () => {
      try {
        subscription?.remove();
      } catch (error) {
        console.warn('Failed to remove notification listener:', error);
      }
    };
  }, [bootstrap]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

