import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform, Alert, TouchableOpacity } from 'react-native';
// On web, react-native-maps can break for this version; guard usage.
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
}
import * as Location from 'expo-location';
import { sendLocationUpdate } from '../../services/locationService';
import { 
  fetchNearbyAlerts, 
  fetchAllIncidents, 
  fetchRecentPanicAlerts,
  IncidentData 
} from '../../services/alertsService';
import socketService from '../../services/socketService';

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
  const [region, setRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
  const [status, setStatus] = useState<string>('');
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [panicAlerts, setPanicAlerts] = useState<PanicAlert[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadIncidentData = async (latitude: number, longitude: number) => {
    setRefreshing(true);
    try {
      // Fetch nearby panic alerts
      const nearbyAlerts = await fetchNearbyAlerts(latitude, longitude, 5000);
      setPanicAlerts(nearbyAlerts || []);

      // Fetch all incidents
      const allIncidents = await fetchAllIncidents(50);
      setIncidents(allIncidents || []);

      // Fetch recent panic alerts
      const recentAlerts = await fetchRecentPanicAlerts(20);
      console.log(`Loaded ${allIncidents.length} incidents and ${recentAlerts.length} alerts`);
    } catch (error) {
      console.error('Failed to load incident data:', error);
      Alert.alert('Error', 'Failed to load incident data. Please try again.');
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
    let interval: any;
    
    const initializeLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is needed for safety monitoring.');
        return;
      }

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
        try {
          const current = await Location.getCurrentPositionAsync({});
          const res = await sendLocationUpdate({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
            speed: current.coords.speed ?? undefined,
            accuracy: current.coords.accuracy ?? undefined
          });
          
          if (res.anomaly) {
            setStatus(`⚠️ Anomaly: ${res.anomaly}`);
          } else if (res.geofences && res.geofences.length) {
            const zones = res.geofences.map((g: any) => g.name).join(', ');
            setStatus(`📍 In zone: ${zones}`);
          } else {
            setStatus('✅ Safe zone');
          }

          // Update region if location changed significantly
          setRegion(prev => prev ? {
            ...prev,
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          } : null);

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
    };
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
    <View style={{ flex: 1 }}>
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
          {Marker && panicAlerts.map((alert) => (
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
        </MapView>
      )}
      
      {/* Status bar */}
      {status && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}
      
      {/* Connection indicator */}
      <View style={styles.connectionBar}>
        <Text style={styles.connectionText}>
          📡 {socketConnected ? 'Connected' : 'Disconnected'} | 
          🚨 {incidents.length} incidents | ⚠️ {panicAlerts.length} alerts
        </Text>
      </View>

      {/* Refresh button */}
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={refreshData}
        disabled={refreshing}
      >
        <Text style={styles.refreshText}>
          {refreshing ? '🔄' : '↻'} Refresh
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  loading: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#0d1117' 
  },
  statusBar: { 
    position: 'absolute', 
    bottom: 60, 
    left: 0, 
    right: 0, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  statusText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontSize: 14,
    fontWeight: '500',
  },
  connectionBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 6,
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  refreshButton: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 20,
  },
  refreshText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  webFallback: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 24, 
    backgroundColor: '#0d1117' 
  },
  webTitle: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: 12 
  },
  webText: { 
    color: '#aaa', 
    textAlign: 'center', 
    lineHeight: 20, 
    marginBottom: 8 
  }
});
