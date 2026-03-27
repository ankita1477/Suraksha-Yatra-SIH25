import * as Notifications from 'expo-notifications';
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform, Alert, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { sendLocationUpdate } from '../../services/locationService';
import SafeZoneService, { SafeZone, SafetyStatus } from '../../services/safeZoneService';
import { 
  fetchNearbyAlerts, 
  fetchAllIncidents, 
  fetchRecentPanicAlerts,
  IncidentData 
} from '../../services/alertsService';
import socketService from '../../services/socketService';
import useAuthStore from '../../state/authStore';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { useNavigation } from '@react-navigation/native';

const { width: SW } = Dimensions.get('window');

// Light theme colors matching HomeScreen
const C = {
  bg: '#F8FAF5',
  card: '#FFFFFF',
  green: '#2D6A4F',
  greenLight: '#B7E4C7',
  greenPale: '#D8F3DC',
  greenDark: '#1B4332',
  accent: '#40916C',
  text: '#1B1B1B',
  textSecondary: '#6B7280',
  border: '#1B1B1B',
  red: '#DC2626',
  orange: '#F59E0B',
  blue: '#3B82F6',
  purple: '#8B5CF6',
};

interface PanicAlert {
  _id: string;
  userId: string;
  lat: number;
  lng: number;
  timestamp: string;
  acknowledged: boolean;
  message?: string;
}

export default function MapScreen() {
  const { token, user } = useAuthStore();
  const navigation = useNavigation();
  const [region, setRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
  const [status, setStatus] = useState<string>('');
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [panicAlerts, setPanicAlerts] = useState<PanicAlert[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<PanicAlert[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [safetyStatus, setSafetyStatus] = useState<SafetyStatus | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const safeZoneService = SafeZoneService.getInstance();
  const prevInsideRef = useRef<boolean | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const loadIncidentData = async (latitude: number, longitude: number) => {
    if (!token || !user) {
      console.log('User not authenticated, skipping incident data load');
      return;
    }
    
    setRefreshing(true);
    try {
      // Fetch nearby panic alerts
      const nearbyAlerts = await fetchNearbyAlerts(latitude, longitude, 5000);
      setPanicAlerts(Array.isArray(nearbyAlerts) ? nearbyAlerts : []);

      // Fetch all incidents
      const allIncidents = await fetchAllIncidents(50);
      setIncidents(Array.isArray(allIncidents) ? allIncidents : []);

      // Fetch recent panic alerts
      const recentAlertsData = await fetchRecentPanicAlerts(20);
      setRecentAlerts(Array.isArray(recentAlertsData) ? recentAlertsData : []);
      
      // Load safe zones
      const zones = await safeZoneService.fetchSafeZones();
      setSafeZones(zones);
      
      // Check current safety status
      const safety = await safeZoneService.checkSafetyStatus(latitude, longitude);
      setSafetyStatus(safety);
      
      console.log(`Loaded ${allIncidents?.length || 0} incidents, ${recentAlertsData?.length || 0} alerts, and ${zones.length} safe zones`);
    } catch (error) {
      console.error('Failed to load incident data:', error);
      // Don't show alert for auth errors, just log them
      if (error instanceof Error && !error.message.includes('Authentication')) {
        Alert.alert('Error', 'Failed to load incident data. Please try again.');
      }
    } finally {
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    if (region) {
      await loadIncidentData(region.latitude, region.longitude);
    }
  };

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    let interval: any;
    
    const initializeLocation = async () => {
      try {
        setError(null);
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          Alert.alert('Permission Required', 'Location permission is needed for safety monitoring.');
          return;
        }

        // Initialize safe zone service
        await safeZoneService.initialize();

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const newRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        setIsInitialized(true);

        // Load all incident data
        await loadIncidentData(loc.coords.latitude, loc.coords.longitude);

        // Start periodic location updates
        interval = setInterval(async () => {
          if (!token || !user) {
            console.log('User not authenticated, skipping location update');
            return;
          }
        
        try {
          const current = await Location.getCurrentPositionAsync({});
          const res = await sendLocationUpdate({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
            speed: current.coords.speed ?? undefined,
            accuracy: current.coords.accuracy ?? undefined
          });
          
          // Update safe zone service with new location
          safeZoneService.updateLocation(current.coords.latitude, current.coords.longitude);
          
          // Check safety status
          const safety = await safeZoneService.checkSafetyStatus(current.coords.latitude, current.coords.longitude);
          setSafetyStatus(safety);
          
          if (res.anomaly) {
            setStatus(`⚠️ Anomaly: ${res.anomaly}`);
          } else if (safety && safety.withinSafeZone) {
            const zoneCount = safety.safeZones.length;
            setStatus(`🛡️ In ${zoneCount} safe zone${zoneCount > 1 ? 's' : ''}`);
          } else if (res.geofences && res.geofences.length) {
            const zones = res.geofences.map((g: any) => g.name).join(', ');
            setStatus(`📍 In zone: ${zones}`);
          } else {
            setStatus('⚠️ Outside safe zones');
          }

          // Update region if location changed significantly
          setRegion(prev => prev ? {
            ...prev,
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          } : null);

          // After setting safetyStatus and status, detect transitions
          if (prevInsideRef.current !== null && safety) {
            if (prevInsideRef.current && !safety.withinSafeZone) {
              // Exited safe zone
              Alert.alert('⚠️ Alert', 'You have exited the safe zone. Please be cautious!');
            } else if (!prevInsideRef.current && safety.withinSafeZone) {
              // Entered safe zone
              Alert.alert('🛡️ Safe Zone', 'You have entered a safe zone.');
            }
          }
          prevInsideRef.current = safety?.withinSafeZone ?? null;

        } catch (e: any) {
          setStatus('❌ Location update failed');
          console.error('Location update error:', e);
        }
        }, 30000); // Update every 30 seconds
      } catch (initError) {
        console.error('Failed to initialize location:', initError);
        setError('Failed to initialize location services');
        setIsInitialized(true); // Still mark as initialized to show error state
      }
    };    initializeLocation();

    // Initialize socket connection
    socketService.connect().then(() => {
      setSocketConnected(socketService.isConnected());
    });

    // Listen for real-time incidents
    const handleNewIncident = (incident: IncidentData) => {
      if (region) {
        const distance = calculateDistance(
          region.latitude,
          region.longitude,
          incident.location.coordinates[1],
          incident.location.coordinates[0]
        );
        
        // Show incidents within 5km
        if (distance < 5000) {
          setIncidents(prev => [...prev, incident]);
          Alert.alert(
            '🚨 Safety Alert',
            `New ${incident.type} incident nearby: ${incident.description || 'Unknown incident'}`,
            [{ text: 'OK' }]
          );
        }
      }
    };

    const handleNewPanicAlert = (alert: any) => {
      if (region) {
        const distance = calculateDistance(
          region.latitude,
          region.longitude,
          alert.lat,
          alert.lng
        );
        
        // Show alerts within 5km
        if (distance < 5000) {
          setPanicAlerts(prev => [...prev, alert]);
          Alert.alert(
            '🆘 Panic Alert',
            'A panic alert was triggered nearby! Please stay alert.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    socketService.on('incident', handleNewIncident);
    socketService.on('panic_alert', handleNewPanicAlert);

    return () => {
      if (interval) clearInterval(interval);
      socketService.off('incident', handleNewIncident);
      socketService.off('panic_alert', handleNewPanicAlert);
      safeZoneService.cleanup();
    };
  }, []);

  useEffect(() => {
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ 
        shouldShowAlert: true, 
        shouldPlaySound: true, 
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true
      })
    });
    safeZoneService.setListeners({
      onEnter: (zones) => {
        Notifications.scheduleNotificationAsync({
          content: { title: '🛡️ Entered Safe Zone', body: `You are now inside ${zones[0]?.name || 'a safe zone'}` },
          trigger: null
        });
      },
      onExit: () => {
        Notifications.scheduleNotificationAsync({
          content: { title: '⚠️ Left Safe Zone', body: 'You have exited all safe zones. Stay alert.' },
          trigger: null
        });
      }
    });
  }, []);

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getMarkerColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <SafeAreaWrapper backgroundColor={C.bg} statusBarStyle="dark-content">
        <View style={styles.loading}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={C.green} />
            <Text style={styles.loadingText}>Initializing map...</Text>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaWrapper backgroundColor={C.bg} statusBarStyle="dark-content">
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={48} color={C.orange} />
            <Text style={styles.errorTitle}>Map Error</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setIsInitialized(false);
              }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!region) return <View style={styles.loading}><ActivityIndicator color={C.green} /></View>;

  return (
    <SafeAreaWrapper backgroundColor={C.bg} statusBarStyle="dark-content">
      <View style={styles.container}>
        {/* ── Header ── */}
        <Animated.View
          style={[styles.header, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color={C.text} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Safety Map</Text>
              <Text style={styles.headerSub}>Real-time monitoring</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={refreshData}
            disabled={refreshing}
            activeOpacity={0.8}
          >
            <Ionicons name={refreshing ? 'sync' : 'refresh'} size={20} color={C.green} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Status Banner ── */}
        {status ? (
          <View style={[
            styles.statusBanner,
            safetyStatus?.withinSafeZone
              ? { backgroundColor: C.greenPale, borderColor: C.green }
              : { backgroundColor: '#FEF3C7', borderColor: '#D97706' },
          ]}>
            <Ionicons
              name={safetyStatus?.withinSafeZone ? 'shield-checkmark' : 'warning-outline'}
              size={18}
              color={safetyStatus?.withinSafeZone ? C.green : '#D97706'}
            />
            <Text style={[
              styles.statusBannerTxt,
              { color: safetyStatus?.withinSafeZone ? C.greenDark : '#92400E' },
            ]}>
              {status}
            </Text>
          </View>
        ) : null}

        {/* ── Map ── */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={region}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            <Marker
              coordinate={region}
              title="You"
              description="Current Location"
              pinColor="#3B82F6"
            />
            {incidents.map((incident) => (
              <Marker
                key={incident._id}
                coordinate={{
                  latitude: incident.location.coordinates[1],
                  longitude: incident.location.coordinates[0],
                }}
                title={`${incident.type.toUpperCase()} Incident`}
                description={incident.description || `${incident.severity} severity`}
                pinColor={getMarkerColor(incident.severity)}
              />
            ))}
            {Array.isArray(panicAlerts) && panicAlerts.map((alert) => (
              <Marker
                key={alert._id}
                coordinate={{ latitude: alert.lat, longitude: alert.lng }}
                title="🆘 PANIC ALERT"
                description={alert.message || `Emergency - ${alert.acknowledged ? 'Acknowledged' : 'Active'}`}
                pinColor={alert.acknowledged ? '#22c55e' : '#dc2626'}
              />
            ))}
            {safeZones.map((zone) => (
              <Circle
                key={zone._id}
                center={{ latitude: zone.center.lat, longitude: zone.center.lng }}
                radius={zone.radius}
                strokeColor="rgba(34,197,94,0.8)"
                fillColor="rgba(34,197,94,0.15)"
                strokeWidth={2}
              />
            ))}
            {safeZones.map((zone) => (
              <Marker
                key={`center-${zone._id}`}
                coordinate={{ latitude: zone.center.lat, longitude: zone.center.lng }}
                title={`🛡️ ${zone.name}`}
                description={zone.description || `Safe zone - ${zone.radius}m`}
                pinColor="#22c55e"
              />
            ))}
          </MapView>
        </View>

        {/* ── Bottom Stats Panel ── */}
        <Animated.View style={[styles.bottomPanel, { opacity: fadeAnim }]}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#FECACA' }]}>
              <Ionicons name="alert-circle" size={20} color={C.red} />
              <Text style={[styles.statNum, { color: C.red }]}>{incidents.length}</Text>
              <Text style={styles.statLabel}>Incidents</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FDE68A' }]}>
              <Ionicons name="megaphone" size={20} color="#D97706" />
              <Text style={[styles.statNum, { color: '#D97706' }]}>{recentAlerts.length}</Text>
              <Text style={styles.statLabel}>Alerts</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: C.greenPale }]}>
              <Ionicons name="shield-checkmark" size={20} color={C.green} />
              <Text style={[styles.statNum, { color: C.green }]}>{safeZones.length}</Text>
              <Text style={styles.statLabel}>Safe Zones</Text>
            </View>
          </View>

          {/* Connection status */}
          <View style={styles.connRow}>
            <View style={[styles.connDot, { backgroundColor: socketConnected ? '#22c55e' : C.red }]} />
            <Text style={styles.connTxt}>
              {socketConnected ? 'Live Connected' : 'Disconnected'}
            </Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: C.border,
    shadowColor: C.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: C.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: C.border,
    shadowColor: C.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },

  /* Status Banner */
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2.5,
    shadowColor: C.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statusBannerTxt: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },

  /* Map Container */
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: C.border,
    shadowColor: C.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  map: {
    flex: 1,
  },

  /* Bottom Panel */
  bottomPanel: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: C.border,
    shadowColor: C.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 10,
    color: C.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  connRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  connDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connTxt: {
    fontSize: 12,
    color: C.textSecondary,
    fontWeight: '600',
  },

  /* Loading */
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
  },
  loadingCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: C.border,
    shadowColor: C.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  loadingText: {
    color: C.text,
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
  },

  /* Error */
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: C.bg,
  },
  errorCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: C.border,
    shadowColor: C.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
    width: '100%',
  },
  errorTitle: {
    color: C.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: {
    color: C.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: C.green,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: C.border,
    shadowColor: C.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
