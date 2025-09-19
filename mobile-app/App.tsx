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
        // Bootstrap auth state (check for stored tokens)
        await bootstrap();
        
        // Initialize push notifications after auth
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log('Push notification token registered:', token);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();

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
  }, [bootstrap]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

