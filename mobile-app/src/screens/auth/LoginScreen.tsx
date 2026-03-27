import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import useAuthStore from '../../state/authStore';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { checkBackendHealth, checkAiHealth } from '../../services/healthService';
import { getApiBaseUrl } from '../../config/env';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const { width: SW } = Dimensions.get('window');
const IMG_AUTH = require('../../../assets/generated/auth_hero_rog.jpg');

const C = {
  page: '#FFFDF7',
  ink: '#171717',
  muted: '#666',
  green: '#2D6A4F',
  orange: '#F97316',
  red: '#EF4444',
  card: '#FFFFFF',
  line: '#171717',
  cloudGreen: '#D8F3DC',
  cloudOrange: '#FED7AA',
  cloudRed: '#FECACA',
};

export default function LoginScreen(_: Props) {
  const { login, register, loading, mode, toggleMode } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [debugOpen, setDebugOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  const [aiStatus, setAiStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  const [apiMessage, setApiMessage] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  const fade = useRef(new Animated.Value(0)).current;
  const drop = useRef(new Animated.Value(18)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(drop, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 1300, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 1300, useNativeDriver: true }),
      ])
    ).start();

    (async () => {
      try {
        setBaseUrl(await getApiBaseUrl());
      } catch {}
    })();
  }, [drop, fade, pulse]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const onSubmit = async () => {
    setError(null);

    if (!email.trim()) return setError('Please enter your email address');
    if (!email.includes('@')) return setError('Please enter a valid email address');
    if (!password.trim()) return setError('Please enter your password');
    if (mode === 'register' && password.length < 6) return setError('Password must be at least 6 characters long');

    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
    } catch (e: any) {
      setError(e?.message || 'Authentication failed');
    }
  };

  const runHealthChecks = async () => {
    setApiStatus('checking');
    setAiStatus('checking');
    setApiMessage('');
    setAiMessage('');

    try {
      const backend = await checkBackendHealth();
      if (backend.ok) {
        setApiStatus('ok');
        setApiMessage('Backend OK');
      } else {
        setApiStatus('fail');
        setApiMessage(backend.error || 'Backend unreachable');
      }
    } catch (e: any) {
      setApiStatus('fail');
      setApiMessage(e?.message || 'Backend check failed');
    }

    try {
      const ai = await checkAiHealth();
      if (ai.ok) {
        setAiStatus('ok');
        setAiMessage('AI OK');
      } else {
        setAiStatus('fail');
        setAiMessage(ai.error || 'AI unreachable');
      }
    } catch (e: any) {
      setAiStatus('fail');
      setAiMessage(e?.message || 'AI check failed');
    }
  };

  return (
    <SafeAreaWrapper backgroundColor={C.page} statusBarStyle="dark-content">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View style={[s.wrap, { opacity: fade, transform: [{ translateY: drop }] }]}>
            <View pointerEvents="none" style={s.bgDecor}>
              <View style={[s.bgBlob, s.blobGreen]} />
              <View style={[s.bgBlob, s.blobOrange]} />
              <View style={[s.bgBlob, s.blobRed]} />
            </View>

            <View style={s.stageCard}>
              <View style={s.stageTextZone}>
                <Text style={s.kicker}>{greeting}</Text>
                <Text style={s.title}>Your Safe Trip Starts Here</Text>
                <Text style={s.subtitle}>Real-time AI safety, quick SOS, and trusted contacts in one place.</Text>

                <View style={s.tagsRow}>
                  <View style={[s.tag, { backgroundColor: C.cloudGreen }]}>
                    <Ionicons name="shield-checkmark" size={13} color={C.green} />
                    <Text style={s.tagText}>Protected</Text>
                  </View>
                  <View style={[s.tag, { backgroundColor: C.cloudOrange }]}>
                    <Ionicons name="flash" size={13} color={C.orange} />
                    <Text style={s.tagText}>Instant Alerts</Text>
                  </View>
                </View>
              </View>

              <Animated.View style={[s.stageImageShell, { transform: [{ scale: pulse }] }]}> 
                <Image source={IMG_AUTH} style={s.stageImage} resizeMode="cover" />
              </Animated.View>
            </View>

            <View style={s.authCard}>
              <View style={s.ticketCutLeft} />
              <View style={s.ticketCutRight} />

              <View style={s.modeSwitch}>
                <TouchableOpacity
                  style={[s.modeBtn, mode === 'login' && { backgroundColor: C.green }]}
                  onPress={() => mode !== 'login' && toggleMode()}
                  activeOpacity={0.85}
                >
                  <Text style={[s.modeText, mode === 'login' && { color: '#fff' }]}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modeBtn, mode === 'register' && { backgroundColor: C.orange }]}
                  onPress={() => mode !== 'register' && toggleMode()}
                  activeOpacity={0.85}
                >
                  <Text style={[s.modeText, mode === 'register' && { color: '#fff' }]}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.inputLabel}>Email</Text>
              <View style={s.inputBox}>
                <Ionicons name="mail-outline" size={18} color={C.muted} />
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#8A8A8A"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <Text style={s.inputLabel}>Password</Text>
              <View style={s.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color={C.muted} />
                <TextInput
                  style={s.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#8A8A8A"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={C.muted} />
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={s.errorRow}>
                  <Ionicons name="alert-circle" size={16} color={C.red} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[s.ctaBtn, { backgroundColor: mode === 'login' ? C.green : C.orange }, loading && { opacity: 0.7 }]}
                onPress={onSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name={mode === 'login' ? 'log-in-outline' : 'person-add-outline'} size={18} color="#fff" />
                    <Text style={s.ctaText}>{mode === 'login' ? 'Enter App' : 'Create Account'}</Text>
                  </>
                )}
              </TouchableOpacity>

              {mode === 'login' ? (
                <TouchableOpacity style={s.forgotBtn} activeOpacity={0.8}>
                  <Text style={s.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity style={s.diagToggle} onLongPress={() => setDebugOpen(v => !v)} delayLongPress={500}>
              <Text style={s.diagToggleText}>{debugOpen ? 'Hide Diagnostics' : 'Hold 0.5s for Diagnostics'}</Text>
            </TouchableOpacity>

            {debugOpen ? (
              <View style={s.diagCard}>
                <Text style={s.diagTitle}>Connectivity</Text>
                <Text style={s.diagLine}>Base URL: <Text style={s.diagMono}>{baseUrl}</Text></Text>
                <View style={s.diagRow}>
                  <Text style={s.diagLine}>Backend: <StatusBadge status={apiStatus} /></Text>
                  <Text style={s.diagLine}>AI: <StatusBadge status={aiStatus} /></Text>
                </View>
                {apiMessage ? <Text style={s.diagMsg}>API: {apiMessage}</Text> : null}
                {aiMessage ? <Text style={s.diagMsg}>AI: {aiMessage}</Text> : null}
                <TouchableOpacity style={s.diagBtn} onPress={runHealthChecks} disabled={apiStatus === 'checking' || aiStatus === 'checking'}>
                  <Text style={s.diagBtnText}>{apiStatus === 'checking' || aiStatus === 'checking' ? 'Checking...' : 'Run Checks'}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const StatusBadge = ({ status }: { status: 'idle' | 'checking' | 'ok' | 'fail' }) => {
  const map: Record<string, { label: string; color: string }> = {
    idle: { label: 'idle', color: '#6B7280' },
    checking: { label: '...', color: '#9CA3AF' },
    ok: { label: 'OK', color: '#16A34A' },
    fail: { label: 'FAIL', color: '#DC2626' },
  };
  const d = map[status];
  return (
    <View style={{ backgroundColor: d.color, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 4 }}>
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{d.label}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 18,
  },
  wrap: {
    paddingHorizontal: 16,
  },
  bgDecor: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  bgBlob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.24,
  },
  blobGreen: { width: 180, height: 180, backgroundColor: C.green, top: -40, right: -30 },
  blobOrange: { width: 160, height: 160, backgroundColor: C.orange, top: 260, left: -46 },
  blobRed: { width: 180, height: 180, backgroundColor: C.red, bottom: 100, right: -42 },

  stageCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: C.line,
    shadowColor: C.line,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 7,
    padding: 12,
    marginBottom: 12,
  },
  stageTextZone: {
    marginBottom: 10,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    color: C.green,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 27,
    lineHeight: 30,
    fontWeight: '900',
    color: C.ink,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: C.muted,
    marginTop: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.ink,
  },
  stageImageShell: {
    width: '100%',
    height: 188,
    borderWidth: 2,
    borderColor: C.line,
    borderRadius: 14,
    overflow: 'hidden',
  },
  stageImage: {
    width: '100%',
    height: '100%',
  },

  authCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: C.line,
    shadowColor: C.line,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    padding: 14,
    position: 'relative',
  },
  ticketCutLeft: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.page,
    left: -8,
    top: 34,
    borderWidth: 2,
    borderColor: C.line,
  },
  ticketCutRight: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.page,
    right: -8,
    top: 34,
    borderWidth: 2,
    borderColor: C.line,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.line,
    padding: 4,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 8,
  },
  modeText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.muted,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: C.ink,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    borderWidth: 2,
    borderColor: C.line,
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: C.ink,
    paddingVertical: 12,
    marginLeft: 7,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.cloudRed,
    borderWidth: 2,
    borderColor: C.line,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  errorText: {
    color: C.red,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  ctaBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: C.line,
    paddingVertical: 13,
    shadowColor: C.line,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  forgotBtn: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 4,
  },
  forgotText: {
    color: C.orange,
    fontSize: 12,
    fontWeight: '800',
  },

  diagToggle: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 4,
  },
  diagToggleText: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  diagCard: {
    marginTop: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: C.line,
    padding: 10,
  },
  diagTitle: {
    color: C.ink,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  diagLine: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  diagMono: {
    color: C.ink,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  diagMsg: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  diagBtn: {
    marginTop: 8,
    backgroundColor: '#111827',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: C.line,
  },
  diagBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
