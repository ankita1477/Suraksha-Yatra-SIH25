import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/main/HomeScreen';
import MapScreen from '../screens/main/MapScreen';
import PanicScreen from '../screens/main/PanicScreen';
import EmergencyContactsScreen from '../screens/main/EmergencyContactsScreen';
import NotificationSettingsScreen from '../screens/main/NotificationSettingsScreen';

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
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Panic" component={PanicScreen} />
        <Stack.Screen 
          name="EmergencyContacts" 
          component={EmergencyContactsScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="NotificationSettings" 
          component={NotificationSettingsScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
