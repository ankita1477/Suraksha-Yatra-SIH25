import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { sendPanicAlert } from '../../services/alertsService';

export default function PanicScreen() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const triggerPanic = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      await sendPanicAlert({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        timestamp: new Date().toISOString()
      });
      setSent(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency SOS</Text>
      <Text style={styles.subtitle}>Press the button below to send an immediate alert with your live location.</Text>
      <TouchableOpacity style={[styles.button, sent && styles.buttonDisabled]} onPress={triggerPanic} disabled={loading || sent}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{sent ? 'Alert Sent ✔' : 'Send Panic Alert'}</Text>}
      </TouchableOpacity>
      {sent && <Text style={styles.success}>Your alert was sent successfully.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#0d1117' },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 12 },
  subtitle: { color: '#ccc', marginBottom: 24 },
  button: { backgroundColor: '#ff4d4f', padding: 20, borderRadius: 100, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#555' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  success: { color: '#4caf50', marginTop: 16, fontWeight: '600' }
});
