import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/main/HomeScreen';
import MapScreen from '../screens/main/MapScreen';
import PanicScreen from '../screens/main/PanicScreen';
import EmergencyContactsScreen from '../screens/main/EmergencyContactsScreen';
import NotificationSettingsScreen from '../screens/main/NotificationSettingsScreen';
import useAuthStore from '../state/authStore';
import { ActivityIndicator, View, Text } from 'react-native';
import { colors } from '../utils/theme';

export type RootStackParamList = {
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

  // Show loading spinner while bootstrapping auth state
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: colors.background 
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ 
          color: colors.text, 
          marginTop: 16,
          fontSize: 16 
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  try {
    return (
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName={isAuthenticated ? "Home" : "Login"}
          screenOptions={{ headerShown: false }}
        >
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
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    );
  } catch (error) {
    console.error('Navigation error:', error);
    // Fallback UI in case of navigation issues
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: 20
      }}>
        <Text style={{ 
          color: colors.text, 
          fontSize: 18,
          textAlign: 'center',
          marginBottom: 20
        }}>
          Navigation Error
        </Text>
        <Text style={{ 
          color: colors.textSecondary, 
          fontSize: 14,
          textAlign: 'center'
        }}>
          Please restart the app
        </Text>
      </View>
    );
  }
}
