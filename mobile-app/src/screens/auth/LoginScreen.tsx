import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import useAuthStore from '../../state/authStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login, register, loading, mode, toggleMode } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
        navigation.replace('Home');
      } else {
        await register(email, password);
        setError('Registered! Please login now.');
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suraksha Yatra</Text>
      <TextInput placeholder="Email" style={styles.input} autoCapitalize='none' value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{mode === 'login' ? 'Login' : 'Register'}</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={toggleMode} style={{ marginTop: 12 }}>
        <Text style={{ color: '#58a6ff', textAlign: 'center' }}>{mode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}</Text>
      </TouchableOpacity>
      <Text style={styles.subtitle}>{mode === 'login' ? 'Enter credentials to continue' : 'Create your account'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#101820' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 24, textAlign: 'center' },
  input: { backgroundColor: '#1e2a33', padding: 14, borderRadius: 8, color: '#fff', marginBottom: 12 },
  button: { backgroundColor: '#ff4d4f', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  subtitle: { color: '#888', fontSize: 12, textAlign: 'center', marginTop: 16 },
  error: { color: '#ff7875', marginBottom: 8 }
});
