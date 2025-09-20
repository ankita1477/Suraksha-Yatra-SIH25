import * as Notifications from 'expo-notifications';
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform, Alert, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// On web, react-native-maps can break for this version; guard usage.
let MapView: any = null;
let Marker: any = null;
let Circle: any = null;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Circle = maps.Circle;
}
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
import { colors, typography, spacing, commonStyles, borderRadius, shadows } from '../../utils/theme';
import { wp, hp, isSmallDevice, TOUCH_TARGET_SIZE } from '../../utils/responsive';

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
  const [region, setRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
  const [status, setStatus] = useState<string>('');
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [panicAlerts, setPanicAlerts] = useState<PanicAlert[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<PanicAlert[]>([]);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [safetyStatus, setSafetyStatus] = useState<SafetyStatus | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed for safety monitoring.');
        return;
      }

      // Initialize safe zone service
      await safeZoneService.initialize();

      const loc = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);

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
    };

    initializeLocation();

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

  if (!region) return <View style={styles.loading}><ActivityIndicator color="#ff4d4f" /></View>;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallback}>
        <Text style={styles.webTitle}>Map Unavailable on Web Preview</Text>
        <Text style={styles.webText}>Open this project in Expo Go / Emulator to view the live map and location status.</Text>
        {status ? <Text style={styles.statusText}>{status}</Text> : null}
        <Text style={styles.webText}>
          Socket: {socketConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </Text>
        <Text style={styles.webText}>
          Incidents: {incidents.length} | Alerts: {panicAlerts.length}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={colors.background} statusBarStyle="light-content">
      <View style={styles.container}>
        {/* Header Section - Matching HomeScreen Style */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Safety Map</Text>
            <Text style={styles.headerSubtitle}>Real-time monitoring</Text>
          </View>
        </Animated.View>

        {/* Map container */}
        <View style={styles.mapContainer}>
          {MapView && (
            <MapView style={styles.map} initialRegion={region}>
              {/* User location marker */}
              {Marker && (
                <Marker 
                  coordinate={region} 
                  title="You" 
                  description="Current Location"
                  pinColor="#2563eb"
                />
              )}
              
              {/* Incident markers */}
              {Marker && incidents.map((incident) => (
                <Marker
                  key={incident._id}
                  coordinate={{
                    latitude: incident.location.coordinates[1],
                    longitude: incident.location.coordinates[0],
                  }}
                  title={`${incident.type.toUpperCase()} Incident`}
                  description={incident.description || `${incident.severity} severity incident`}
                  pinColor={getMarkerColor(incident.severity)}
                />
              ))}

              {/* Panic alert markers */}
              {Marker && Array.isArray(panicAlerts) && panicAlerts.map((alert) => (
                <Marker
                  key={alert._id}
                  coordinate={{
                    latitude: alert.lat,
                    longitude: alert.lng,
                  }}
                  title="🆘 PANIC ALERT"
                  description={alert.message || `Emergency alert - ${alert.acknowledged ? 'Acknowledged' : 'Awaiting response'}`}
                  pinColor={alert.acknowledged ? "#22c55e" : "#dc2626"}
                />
              ))}

              {/* Safe zone circles */}
              {Circle && safeZones.map((zone) => (
                <Circle
                  key={zone._id}
                  center={{
                    latitude: zone.center.lat,
                    longitude: zone.center.lng,
                  }}
                  radius={zone.radius}
                  strokeColor="rgba(34, 197, 94, 0.8)"
                  fillColor="rgba(34, 197, 94, 0.2)"
                  strokeWidth={2}
                />
              ))}

              {/* Safe zone center markers */}
              {Marker && safeZones.map((zone) => (
                <Marker
                  key={`center-${zone._id}`}
                  coordinate={{
                    latitude: zone.center.lat,
                    longitude: zone.center.lng,
                  }}
                  title={`🛡️ ${zone.name}`}
                  description={zone.description || `Safe zone - ${zone.radius}m radius`}
                  pinColor="#22c55e"
                />
              ))}
            </MapView>
          )}
        </View>
        
        {/* Modern status cards */}
        {status && (
          <Animated.View style={[styles.statusCard, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
              style={styles.statusGradient}
            >
              <Text style={styles.statusText}>{status}</Text>
            </LinearGradient>
          </Animated.View>
        )}
        
        {/* Bottom info panel */}
        <Animated.View style={[styles.bottomPanel, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
            style={styles.panelGradient}
          >
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{incidents.length}</Text>
                <Text style={styles.statLabel}>Incidents</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{recentAlerts.length}</Text>
                <Text style={styles.statLabel}>Alerts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{safeZones.length}</Text>
                <Text style={styles.statLabel}>Safe Zones</Text>
              </View>
            </View>
            
            <View style={styles.connectionStatus}>
              <View style={[styles.statusDot, { backgroundColor: socketConnected ? '#22c55e' : '#ef4444' }]} />
              <Text style={styles.connectionText}>
                {socketConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Modern refresh button */}
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={refreshData}
          disabled={refreshing}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.refreshGradient}
          >
            <Text style={styles.refreshText}>
              {refreshing ? '🔄' : '↻'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.heading2,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
    margin: wp(3),
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  map: { 
    flex: 1 
  },
  statusCard: {
    position: 'absolute',
    top: hp(15),
    left: wp(5),
    right: wp(5),
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  statusGradient: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
  },
  statusText: { 
    color: '#ffffff', 
    textAlign: 'center', 
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: hp(2),
    left: wp(5),
    right: wp(5),
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  panelGradient: {
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp(1),
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  connectionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  refreshButton: {
    position: 'absolute',
    top: hp(10),
    right: wp(5),
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    overflow: 'hidden',
    ...shadows.medium,
  },
  refreshGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loading: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: colors.background,
  },
  webFallback: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: spacing.xl, 
    backgroundColor: colors.background,
  },
  webTitle: { 
    color: '#ffffff', 
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: spacing.md,
  },
  webText: { 
    color: colors.textSecondary, 
    textAlign: 'center', 
    lineHeight: 20, 
    marginBottom: spacing.sm,
  },
});
