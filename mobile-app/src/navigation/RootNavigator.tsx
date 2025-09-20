import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/main/HomeScreen';
import MapScreen from '../screens/main/MapScreen';
import PanicScreen from '../screens/main/PanicScreen';
import EmergencyContactsScreen from '../screens/main/EmergencyContactsScreen';
import NotificationSettingsScreen from '../screens/main/NotificationSettingsScreen';
import useAuthStore from '../state/authStore';
import { ActivityIndicator, View } from 'react-native';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Home: undefined;
  Map: undefined;
  Panic: undefined;
  EmergencyContacts: undefined;
  NotificationSettings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const loading = useAuthStore(state => state.loading);
  const beenToSplash = useAuthStore(state => state.beenToSplash);
  const markSplashSeen = useAuthStore(state => state.markSplashSeen);
  const bootstrap = useAuthStore(state => state.bootstrap);

  useEffect(() => {
    // Run bootstrap exactly once
    bootstrap();
  }, []);

  // Mark splash as seen when auth finished loading
  useEffect(() => {
    if (!loading && !beenToSplash) {
      markSplashSeen();
    }
  }, [loading]);

  // Show loading spinner while bootstrapping auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Authenticated stack
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="Panic" component={PanicScreen} />
            <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
          </>
        ) : (
          // Unauthenticated stack
          <>
            {!beenToSplash && <Stack.Screen name="Splash" component={SplashScreen} />}
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
