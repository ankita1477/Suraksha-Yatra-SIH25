import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { registerForPushNotificationsAsync, addNotificationResponseListener } from './src/services/notificationService';
import useAuthStore from './src/state/authStore';
import { initNetworkService, startNetworkListener, subscribeNetwork } from './src/services/offline/networkService';
import { initOfflineDb } from './src/services/offline/offlineLocationQueue';
import { seedEmergencyPhrases } from './src/services/offline/offlinePhrases';
import { syncOfflineLocations } from './src/services/offline/syncService';

export default function App() {
  const bootstrap = useAuthStore(state => state.bootstrap);

  useEffect(() => {
    let stopNetworkListener: (() => void) | undefined;
    let unsubscribeNetworkEvents: (() => void) | undefined;

    // Initialize authentication state first
    const initializeApp = async () => {
      try {
        // Bootstrap auth state (check for stored tokens)
        await bootstrap();

        // Prepare offline infrastructure before enabling continuous tracking.
        await initNetworkService();
        await initOfflineDb();
        await seedEmergencyPhrases();

        unsubscribeNetworkEvents = subscribeNetwork(async (online) => {
          if (online) {
            const syncedCount = await syncOfflineLocations();
            if (syncedCount > 0) {
              console.log(`Synced ${syncedCount} offline location records`);
            }
          }
        });
        stopNetworkListener = startNetworkListener();
        await syncOfflineLocations();
        
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
      stopNetworkListener?.();
      unsubscribeNetworkEvents?.();
    };
  }, [bootstrap]);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

