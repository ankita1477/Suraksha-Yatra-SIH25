import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import useAuthStore from '../../state/authStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome {user?.email || 'Traveler'} 👋</Text>
      <Text style={styles.text}>Quick Actions</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Map')}>
          <Text style={styles.cardText}>Live Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Panic')}>
          <Text style={styles.cardText}>Panic Button</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={logout} style={styles.logout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#0d1117' },
  heading: { fontSize: 22, fontWeight: '600', color: '#fff', marginBottom: 16 },
  text: { color: '#aaa', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12 },
  card: { flex: 1, backgroundColor: '#1e2a33', padding: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardText: { color: '#fff', fontWeight: '600' },
  logout: { marginTop: 'auto', padding: 12, alignItems: 'center' },
  logoutText: { color: '#ff4d4f' }
});
