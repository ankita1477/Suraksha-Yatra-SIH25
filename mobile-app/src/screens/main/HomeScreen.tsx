import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';

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
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.email?.split('@')[0] || 'Traveler'}</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.headerIconBtn}
          onPress={() => navigation.navigate('NotificationSettings')}
        >
          <Ionicons name="notifications" size={22} color="#e5e7eb" />
        </TouchableOpacity>
      </View>

      {/* Status Chips */}
      <View style={styles.chipsRow}>
        <View style={[styles.chip, socketConnected ? styles.chipOk : styles.chipWarn]}>
          <Ionicons name="shield-checkmark" size={14} color={socketConnected ? '#10b981' : '#f43f5e'} />
          <Text style={[styles.chipText, { color: socketConnected ? '#10b981' : '#f43f5e' }]}>
            {socketConnected ? 'Protected' : 'Offline'}
          </Text>
        </View>
        <View style={[styles.chip, locationStatus.isTracking ? styles.chipOk : styles.chipWarn]}>
          <Ionicons name="location" size={14} color={locationStatus.isTracking ? '#10b981' : '#f43f5e'} />
          <Text style={[styles.chipText, { color: locationStatus.isTracking ? '#10b981' : '#f43f5e' }]}>
            {locationStatus.isTracking ? 'Tracking On' : 'Tracking Off'}
          </Text>
        </View>
        {recentAlerts > 0 && (
          <View style={[styles.chip, styles.chipAlert]}>
            <Ionicons name="alert" size={14} color="#f59e0b" />
            <Text style={[styles.chipText, { color: '#f59e0b' }]}>{recentAlerts} alerts</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Hero SOS */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Need help?</Text>
          <Text style={styles.heroSubtitle}>Tap SOS to alert authorities with your location</Text>
          <TouchableOpacity
            style={styles.sosButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Panic')}
          >
            <Ionicons name="alert-circle" size={42} color="#fff" />
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.tile} onPress={() => navigation.navigate('Map')}>
            <View style={[styles.tileIconWrap, { backgroundColor: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.35)' }]}>
              <Ionicons name="map" size={22} color="#60a5fa" />
            </View>
            <Text style={styles.tileTitle}>Live Map</Text>
            <Text style={styles.tileSubtitle}>View incidents nearby</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.tile}
            onPress={toggleLocationTracking}
          >
            <View style={[styles.tileIconWrap, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.35)' }]}>
              <Ionicons name={locationStatus.isTracking ? 'pause-circle' : 'play-circle'} size={22} color="#34d399" />
            </View>
            <Text style={styles.tileTitle}>{locationStatus.isTracking ? 'Stop Tracking' : 'Start Tracking'}</Text>
            <Text style={styles.tileSubtitle}>{locationStatus.isTracking ? 'Location active' : 'Enable tracking'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tile} onPress={() => navigation.navigate('EmergencyContacts')}>
            <View style={[styles.tileIconWrap, { backgroundColor: 'rgba(251,113,133,0.15)', borderColor: 'rgba(251,113,133,0.35)' }]}>
              <Ionicons name="people" size={22} color="#fb7185" />
            </View>
            <Text style={styles.tileTitle}>Emergency Contacts</Text>
            <Text style={styles.tileSubtitle}>Manage contacts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tile} onPress={handleEmergencyTest}>
            <View style={[styles.tileIconWrap, { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.35)' }]}>
              <Ionicons name="flask" size={22} color="#f59e0b" />
            </View>
            <Text style={styles.tileTitle}>Test Alert</Text>
            <Text style={styles.tileSubtitle}>Send test notification</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity onPress={logout} style={styles.logout}>
          <Ionicons name="log-out" size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#0b1220' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  greeting: { color: '#9aa4b2', fontSize: 14 },
  userName: { color: '#e5e7eb', fontSize: 20, fontWeight: '700' },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(30, 41, 59, 0.55)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.35)'
  },
  chipOk: { backgroundColor: 'rgba(6, 78, 59, 0.15)', borderColor: 'rgba(16, 185, 129, 0.35)' },
  chipWarn: { backgroundColor: 'rgba(69, 10, 10, 0.15)', borderColor: 'rgba(239, 68, 68, 0.35)' },
  chipAlert: { backgroundColor: 'rgba(120, 53, 15, 0.15)', borderColor: 'rgba(245, 158, 11, 0.35)' },
  chipText: { fontSize: 12, fontWeight: '600' },
  heroCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.35)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  heroTitle: { color: '#e5e7eb', fontSize: 18, fontWeight: '700' },
  heroSubtitle: { color: '#9aa4b2', fontSize: 13, marginTop: 6 },
  sosButton: {
    alignSelf: 'center',
    marginTop: 14,
    backgroundColor: '#ef4444',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#ef4444',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  sosText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  sectionTitle: { color: '#9aa4b2', fontSize: 13, marginBottom: 10, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '48%',
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.35)'
  },
  tileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  tileTitle: { color: '#e5e7eb', fontWeight: '700' },
  tileSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  logout: { 
    marginTop: 18,
    padding: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    flexDirection: 'row'
  },
  logoutText: { color: '#ef4444', fontWeight: '700' }
});
