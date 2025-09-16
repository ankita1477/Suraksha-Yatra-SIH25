import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import useAuthStore from '../../state/authStore';
import socketService from '../../services/socketService';
import { 
  startLocationTracking, 
  stopLocationTracking, 
  isLocationTrackingActive,
  getLocationStatus 
} from '../../services/locationService';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const [socketConnected, setSocketConnected] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<number>(0);
  const [locationStatus, setLocationStatus] = useState({
    hasPermission: false,
    isTracking: false,
    backgroundEnabled: false
  });

  useEffect(() => {
    // Initialize socket connection
    socketService.connect().then(() => {
      setSocketConnected(socketService.isConnected());
    });

    // Initialize location tracking
    initializeLocationTracking();

    // Listen for real-time alerts
    const handlePanicAlert = (data: any) => {
      setRecentAlerts(prev => prev + 1);
      Alert.alert(
        '🚨 Safety Alert',
        'A panic alert was triggered in your area. Check the map for details.',
        [{ text: 'View Map', onPress: () => navigation.navigate('Map') }, { text: 'OK' }]
      );
    };

    const handleIncident = (data: any) => {
      setRecentAlerts(prev => prev + 1);
      if (data.severity === 'high' || data.severity === 'critical') {
        Alert.alert(
          '⚠️ Safety Warning',
          `${data.type} incident detected: ${data.description || 'Please stay alert.'}`,
          [{ text: 'View Map', onPress: () => navigation.navigate('Map') }, { text: 'OK' }]
        );
      }
    };

    socketService.on('panic_alert', handlePanicAlert);
    socketService.on('incident', handleIncident);

    // Check connection status periodically
    const connectionInterval = setInterval(() => {
      setSocketConnected(socketService.isConnected());
      updateLocationStatus();
    }, 5000);

    return () => {
      socketService.off('panic_alert', handlePanicAlert);
      socketService.off('incident', handleIncident);
      clearInterval(connectionInterval);
      // Clean up location tracking on unmount
      stopLocationTracking();
    };
  }, [navigation]);

  const initializeLocationTracking = async () => {
    try {
      const success = await startLocationTracking(
        (location, response) => {
          console.log('Location updated:', location.coords);
          if (response.anomaly) {
            setRecentAlerts(prev => prev + 1);
          }
        },
        {
          timeInterval: 30000, // 30 seconds
          distanceInterval: 100, // 100 meters
        }
      );
      
      if (success) {
        console.log('Location tracking started successfully');
      }
    } catch (error) {
      console.error('Failed to start location tracking:', error);
    }
    
    // Update initial status
    updateLocationStatus();
  };

  const updateLocationStatus = async () => {
    try {
      const status = await getLocationStatus();
      setLocationStatus(status);
    } catch (error) {
      console.error('Failed to get location status:', error);
    }
  };

  const toggleLocationTracking = async () => {
    if (locationStatus.isTracking) {
      await stopLocationTracking();
      Alert.alert('Location Tracking', 'Location tracking has been stopped.');
    } else {
      const success = await startLocationTracking();
      if (success) {
        Alert.alert('Location Tracking', 'Location tracking has been started.');
      } else {
        Alert.alert('Error', 'Failed to start location tracking. Please check permissions.');
      }
    }
    updateLocationStatus();
  };

  const handleEmergencyTest = () => {
    Alert.alert(
      'Emergency Test',
      'This will trigger a test panic alert. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Test', onPress: () => navigation.navigate('Panic') }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome {user?.email?.split('@')[0] || 'Traveler'} 👋</Text>
      
      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          📡 Status: {socketConnected ? '🟢 Protected' : '🔴 Offline'}
        </Text>
        <Text style={styles.statusText}>
          📍 Location: {locationStatus.isTracking ? '🟢 Tracking' : '🔴 Not Tracking'}
        </Text>
        {recentAlerts > 0 && (
          <Text style={styles.alertsText}>
            🚨 {recentAlerts} recent alert{recentAlerts > 1 ? 's' : ''} in your area
          </Text>
        )}
      </View>

      <Text style={styles.text}>Quick Actions</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Map')}>
          <Text style={styles.cardEmoji}>🗺️</Text>
          <Text style={styles.cardText}>Live Map</Text>
          <Text style={styles.cardSubtext}>View safety zones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.panicCard]} onPress={() => navigation.navigate('Panic')}>
          <Text style={styles.cardEmoji}>🆘</Text>
          <Text style={styles.cardText}>Panic Button</Text>
          <Text style={styles.cardSubtext}>Emergency alert</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity 
          style={[styles.card, locationStatus.isTracking ? styles.trackingActiveCard : styles.trackingInactiveCard]} 
          onPress={toggleLocationTracking}
        >
          <Text style={styles.cardEmoji}>{locationStatus.isTracking ? '📍' : '📍'}</Text>
          <Text style={styles.cardText}>
            {locationStatus.isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
          <Text style={styles.cardSubtext}>
            {locationStatus.isTracking ? 'Location active' : 'Enable tracking'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('EmergencyContacts')}>
          <Text style={styles.cardEmoji}>�</Text>
          <Text style={styles.cardText}>Emergency Contacts</Text>
          <Text style={styles.cardSubtext}>Manage contacts</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.card} onPress={handleEmergencyTest}>
          <Text style={styles.cardEmoji}>🧪</Text>
          <Text style={styles.cardText}>Test Alert</Text>
          <Text style={styles.cardSubtext}>Test emergency</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('NotificationSettings')}>
          <Text style={styles.cardEmoji}>�</Text>
          <Text style={styles.cardText}>Notification Settings</Text>
          <Text style={styles.cardSubtext}>Configure alerts</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={logout} style={styles.logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#0d1117' },
  heading: { fontSize: 22, fontWeight: '600', color: '#fff', marginBottom: 16 },
  statusContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.3)',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  alertsText: {
    color: '#fbbf24',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  text: { color: '#aaa', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: { 
    flex: 1, 
    backgroundColor: '#1e2a33', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.3)',
  },
  panicCard: {
    backgroundColor: '#dc2626',
    borderColor: '#ef4444',
  },
  trackingActiveCard: {
    backgroundColor: '#16a34a',
    borderColor: '#22c55e',
  },
  trackingInactiveCard: {
    backgroundColor: '#737373',
    borderColor: '#a3a3a3',
  },
  cardEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  cardText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 14,
    marginBottom: 4,
  },
  cardSubtext: {
    color: '#aaa',
    fontSize: 11,
    textAlign: 'center',
  },
  logout: { 
    marginTop: 'auto', 
    padding: 12, 
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: { color: '#ff4d4f', fontWeight: '500' }
});
