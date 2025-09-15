import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
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

export default function MapScreen() {
  const [region, setRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    let interval: any;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      // Start periodic updates
      interval = setInterval(async () => {
        try {
          const current = await Location.getCurrentPositionAsync({});
          const res = await sendLocationUpdate({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
            speed: current.coords.speed ?? undefined,
            accuracy: current.coords.accuracy ?? undefined
          });
          if (res.anomaly) setStatus(`Anomaly: ${res.anomaly}`);
          else if (res.geofences && res.geofences.length) setStatus(`In zone: ${res.geofences.map((g:any)=>g.name).join(', ')}`);
          else setStatus('');
        } catch (e: any) {
          setStatus('Location update failed');
        }
      }, 60000); // 1 min
    })();
    return () => interval && clearInterval(interval);
  }, []);

  if (!region) return <View style={styles.loading}><ActivityIndicator color="#ff4d4f" /></View>;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallback}>
        <Text style={styles.webTitle}>Map Unavailable on Web Preview</Text>
        <Text style={styles.webText}>Open this project in Expo Go / Emulator to view the live map and location status.</Text>
        {status ? <Text style={styles.statusText}>{status}</Text> : null}
      </View>
    );
  }

  return (
    <View style={{ flex:1 }}>
      {MapView && <MapView style={styles.map} initialRegion={region}>
        {Marker && <Marker coordinate={region} title="You" description="Current Location" />}
      </MapView>}
      {status ? <View style={styles.statusBar}><Text style={styles.statusText}>{status}</Text></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1117' },
  statusBar: { position: 'absolute', bottom: 0, left:0, right:0, backgroundColor: 'rgba(0,0,0,0.6)', padding:8 },
  statusText: { color: '#fff', textAlign: 'center', fontSize: 12 }
  ,webFallback: { flex:1, alignItems:'center', justifyContent:'center', padding:24, backgroundColor:'#0d1117' }
  ,webTitle: { color:'#fff', fontSize:20, fontWeight:'600', marginBottom:12 }
  ,webText: { color:'#aaa', textAlign:'center', lineHeight:20, marginBottom:8 }
});
