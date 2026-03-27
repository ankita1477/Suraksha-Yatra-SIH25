import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import useAuthStore from '../../state/authStore';
import socketService from '../../services/socketService';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { Ionicons } from '@expo/vector-icons';
import {
  startLocationTracking,
  stopLocationTracking,
} from '../../services/locationService';
import { sendPanicAlert as sendPanicAlertAPI } from '../../services/alertsService';
import { sendEmergencyNotification } from '../../services/notificationService';
import * as Location from 'expo-location';

const { width: SW } = Dimensions.get('window');

// Generated illustrations
const IMG_HERO = require('../../../assets/generated/hero_v1_green_orange.jpg');
const IMG_SAFE_ZONE = require('../../../assets/generated/safe_zone.jpg');
const IMG_EMERGENCY = require('../../../assets/generated/emergency_contact.jpg');
const IMG_MAP = require('../../../assets/generated/map_safety.jpg');
const IMG_PANIC = require('../../../assets/generated/panic_alert.jpg');

// Theme colors
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
  border: '#E5E7EB',
  red: '#DC2626',
  orange: '#F59E0B',
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const FEATURES = [
  { key: 'Map', icon: 'map-outline', label: 'Safety Map', subtitle: 'View safe zones and routes nearby', img: IMG_MAP, color: '#1B4332', bg: '#B7E4C7', pattern: 'rings' },
  { key: 'EmergencyContacts', icon: 'people-outline', label: 'Contacts', subtitle: 'Manage emergency contacts', img: IMG_EMERGENCY, color: '#6D28D9', bg: '#DDD6FE', pattern: 'diagonal' },
  { key: 'Panic', icon: 'alert-circle-outline', label: 'Panic Alert', subtitle: 'Send instant SOS alert', img: IMG_PANIC, color: '#DC2626', bg: '#FECACA', pattern: 'arcs' },
  { key: 'Feedback', icon: 'chatbubble-outline', label: 'Feedback', subtitle: 'Report issues and suggestions', img: null, color: '#D97706', bg: '#FDE68A', pattern: 'grid' },
] as const;

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const [recentAlerts, setRecentAlerts] = useState(0);
  const [locationActive, setLocationActive] = useState(false);
  const [sosSending, setSosSending] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;
  const sosPulse = useRef(new Animated.Value(1)).current;
  const settingsSpin = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const settingsLoop = useRef<Animated.CompositeAnimation | null>(null);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const firstName = user?.email?.split('@')[0] || 'Traveler';

  const handleSOS = () => {
    if (sosSending) return;
    Alert.alert(
      '🚨 Send SOS Alert?',
      'This will immediately alert your emergency contacts and nearby services with your location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND SOS',
          style: 'destructive',
          onPress: async () => {
            setSosSending(true);
            Vibration.vibrate([500, 200, 500]);
            try {
              let location = null;
              try {
                location = await Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.High,
                });
              } catch {}

              const payload = {
                lat: location?.coords.latitude || 0,
                lng: location?.coords.longitude || 0,
                timestamp: new Date().toISOString(),
              };

              await sendPanicAlertAPI(payload);
              await sendEmergencyNotification('panic', {
                latitude: payload.lat,
                longitude: payload.lng,
              });

              setSosSent(true);
              Alert.alert('✅ SOS Sent', 'Emergency contacts and nearby services have been alerted.', [
                { text: 'OK', onPress: () => setSosSent(false) },
              ]);
            } catch {
              Alert.alert('❌ Failed', 'Could not send SOS. Check your connection and try again.');
            } finally {
              setSosSending(false);
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    socketService.connect().catch(() => {});

    startLocationTracking(
      (loc, res) => {
        setLocationActive(true);
        if (res?.anomaly) setRecentAlerts(p => p + 1);
      },
      { timeInterval: 30000, distanceInterval: 100 },
    ).catch(() => {});

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(sosPulse, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(sosPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    );
    pulseLoop.current.start();

    const onPanic = () => {
      setRecentAlerts(p => p + 1);
      Alert.alert('🚨 Safety Alert', 'A panic alert was triggered nearby.', [
        { text: 'View Map', onPress: () => navigation.navigate('Map') },
        { text: 'OK' },
      ]);
    };
    const onIncident = (d: any) => {
      setRecentAlerts(p => p + 1);
      if (d.severity === 'high' || d.severity === 'critical') {
        Alert.alert('⚠️ Warning', `${d.type}: ${d.description || 'Stay alert.'}`, [
          { text: 'Map', onPress: () => navigation.navigate('Map') },
          { text: 'OK' },
        ]);
      }
    };
    socketService.on('panic_alert', onPanic);
    socketService.on('incident', onIncident);

    return () => {
      socketService.off('panic_alert', onPanic);
      socketService.off('incident', onIncident);
      pulseLoop.current?.stop();
      stopLocationTracking();
    };
  }, [navigation]);

  useEffect(() => {
    settingsLoop.current = Animated.loop(
      Animated.timing(settingsSpin, {
        toValue: 1,
        duration: 6000,
        useNativeDriver: true,
      })
    );
    settingsLoop.current.start();

    return () => {
      settingsLoop.current?.stop();
      settingsSpin.setValue(0);
    };
  }, [settingsSpin]);

  const settingsRotate = settingsSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderCardPattern = (p: (typeof FEATURES)[number]['pattern']) => {
    if (p === 'rings') {
      return (
        <View pointerEvents="none" style={s.patternWrap}>
          <View style={[s.patternRing, s.patternRing1]} />
          <View style={[s.patternRing, s.patternRing2]} />
          <View style={[s.patternRing, s.patternRing3]} />
        </View>
      );
    }

    if (p === 'diagonal') {
      return (
        <View pointerEvents="none" style={s.patternWrap}>
          <View style={[s.patternLine, s.patternLine1]} />
          <View style={[s.patternLine, s.patternLine2]} />
          <View style={[s.patternLine, s.patternLine3]} />
          <View style={[s.patternLine, s.patternLine4]} />
        </View>
      );
    }

    if (p === 'arcs') {
      return (
        <View pointerEvents="none" style={s.patternWrap}>
          <View style={[s.patternArc, s.patternArc1]} />
          <View style={[s.patternArc, s.patternArc2]} />
          <View style={[s.patternArc, s.patternArc3]} />
        </View>
      );
    }

    return (
      <View pointerEvents="none" style={s.patternWrap}>
        <View style={[s.patternGridLineV, { left: 34 }]} />
        <View style={[s.patternGridLineV, { left: 68 }]} />
        <View style={[s.patternGridLineH, { top: 30 }]} />
        <View style={[s.patternGridLineH, { top: 60 }]} />
      </View>
    );
  };

  return (
    <SafeAreaWrapper backgroundColor={C.bg} statusBarStyle="dark-content">
      <ScrollView style={s.root} showsVerticalScrollIndicator={false} bounces>
        {/* ── Top Bar ── */}
        <Animated.View style={[s.topBar, { opacity: fade, transform: [{ translateY: slide }] }]}>
          <View>
            <Text style={s.greeting}>{greeting},</Text>
            <Text style={s.name}>{firstName} 👋</Text>
          </View>
          <View style={s.topRight}>
            <TouchableOpacity
              style={[s.iconBtn, s.settingsBtn]}
              onPress={() => navigation.navigate('NotificationSettings')}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ rotate: settingsRotate }] }}>
                <Ionicons name="settings-outline" size={21} color="#FFFFFF" />
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity style={s.iconBtn} onPress={logout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={22} color={C.textSecondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Hero Banner with Illustration ── */}
        <Animated.View style={[s.heroBanner, { opacity: fade, transform: [{ translateY: slide }] }]}>
          <View style={s.heroContent}>
            <Text style={s.heroTitle}>Travel Safe,{'\n'}Travel Smart</Text>
            <Text style={s.heroSub}>
              AI-powered safety companion{'\n'}for every journey
            </Text>
            <View style={s.heroStatusRow}>
              <View style={[s.statusDot, { backgroundColor: locationActive ? '#22C55E' : C.orange }]} />
              <Text style={s.heroStatusTxt}>
                {locationActive ? 'Protection Active' : 'Enable Location'}
              </Text>
            </View>
          </View>
          <Image source={IMG_HERO} style={s.heroImg} resizeMode="cover" />
        </Animated.View>

        {/* ── Safety Zone Banner ── */}
        <Animated.View style={[s.safeZoneBanner, { opacity: fade }]}>
          <TouchableOpacity
            style={s.safeZoneInner}
            onPress={() => navigation.navigate('Map')}
            activeOpacity={0.8}
          >
            <Image source={IMG_SAFE_ZONE} style={s.safeZoneImg} resizeMode="cover" />
            <View style={s.safeZoneText}>
              <View style={s.safeZoneBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#fff" />
                <Text style={s.safeZoneBadgeTxt}>Safe Zone</Text>
              </View>
              <Text style={s.safeZoneTitle}>You're in a monitored area</Text>
              <Text style={s.safeZoneSub}>
                {locationActive
                  ? `${recentAlerts} alert${recentAlerts !== 1 ? 's' : ''} detected • Tap to view map`
                  : 'Enable location to see safety status'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.accent} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── SOS Emergency Button ── */}
        <Animated.View style={[s.sosSection, { opacity: fade }]}>
          <Animated.View style={{ transform: [{ scale: sosPulse }] }}>
            <TouchableOpacity
              style={[s.sosBtn, sosSent && { backgroundColor: '#22C55E' }]}
              onPress={handleSOS}
              activeOpacity={0.85}
              disabled={sosSending}
            >
              {sosSending ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : sosSent ? (
                <Ionicons name="checkmark-circle" size={36} color="#fff" />
              ) : (
                <>
                  <Ionicons name="finger-print" size={32} color="#fff" />
                  <Text style={s.sosLabel}>SOS</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
          <Text style={s.sosHint}>
            {sosSending ? 'Sending alert...' : sosSent ? 'Alert sent!' : 'Tap to send emergency alert'}
          </Text>
        </Animated.View>

        {/* ── Stats Row ── */}
        <Animated.View style={[s.statsRow, { opacity: fade, transform: [{ translateY: slide }] }]}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{recentAlerts}</Text>
            <Text style={s.statLabel}>Alerts</Text>
          </View>
          <View style={s.statCard}>
            <Ionicons
              name={locationActive ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={locationActive ? '#22C55E' : C.textSecondary}
            />
            <Text style={s.statLabel}>Tracking</Text>
          </View>
          <View style={s.statCard}>
            <Ionicons name="shield-checkmark" size={22} color={C.green} />
            <Text style={s.statLabel}>Protected</Text>
          </View>
        </Animated.View>

        {/* ── Quick Actions Grid ── */}
        <Animated.View style={[s.section, { opacity: fade, transform: [{ translateY: slide }] }]}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.featureGrid}>
            {FEATURES.map((f, i) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  s.featureCard,
                  (i === 0 || i === 3) && s.featureCardWide,
                  { backgroundColor: f.bg },
                ]}
                onPress={() => navigation.navigate(f.key as any)}
                activeOpacity={0.85}
              >
                {renderCardPattern(f.pattern)}
                <View style={s.featureContent}>
                  <View style={s.featureTop}>
                    <Text style={[s.featureLabel, { color: f.color }]} numberOfLines={2}>{f.label}</Text>
                    <Text style={s.featureSub} numberOfLines={2}>{f.subtitle}</Text>
                  </View>

                  <View style={s.featureBottom}>
                    <View style={[s.featureIconWrap, { backgroundColor: '#fff' }]}>
                      <Ionicons name={f.icon as any} size={20} color={f.color} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* ── Alert Banner ── */}
        {recentAlerts > 0 && (
          <TouchableOpacity style={s.alertStrip} onPress={() => navigation.navigate('Map')} activeOpacity={0.8}>
            <View style={s.alertIconWrap}>
              <Ionicons name="warning" size={16} color="#fff" />
            </View>
            <Text style={s.alertStripTxt}>
              {recentAlerts} alert{recentAlerts > 1 ? 's' : ''} nearby — tap to view
            </Text>
            <Ionicons name="chevron-forward" size={18} color={C.red} />
          </TouchableOpacity>
        )}

        {/* ── Safety Tips ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Safety Tips</Text>
          {[
            { icon: 'location', color: C.green, text: 'Keep location services on for real-time protection' },
            { icon: 'people', color: C.accent, text: 'Add at least 3 emergency contacts' },
            { icon: 'map', color: '#2D6A4F', text: 'Check the safety map before exploring new areas' },
          ].map((t, i) => (
            <View key={i} style={s.tipRow}>
              <View style={[s.tipDot, { backgroundColor: t.color + '20' }]}>
                <Ionicons name={t.icon as any} size={16} color={t.color} />
              </View>
              <Text style={s.tipTxt}>{t.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Tabs (Home + Profile) */}
      <View style={s.bottomTabsOuter}>
        <View style={s.bottomTabsInner}>
          <TouchableOpacity style={s.bottomTabActive} activeOpacity={0.85}>
            <Ionicons name="home" size={16} color={C.text} />
            <Text style={s.bottomTabActiveText}>HOME</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.bottomTabBtn}
            onPress={() => navigation.navigate('NotificationSettings')}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={17} color="#FFFFFF" />
            <Text style={s.bottomTabText}>PROFILE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaWrapper>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  greeting: { fontSize: 14, color: C.textSecondary, fontWeight: '500' },
  name: { fontSize: 24, color: C.text, fontWeight: '800', marginTop: 2 },
  topRight: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1B1B1B',
    shadowColor: '#1B1B1B',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  settingsBtn: {
    backgroundColor: C.green,
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red,
  },

  /* Hero Banner */
  heroBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: '#D8F3DC',
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 180,
    borderWidth: 2.5,
    borderColor: '#1B1B1B',
    shadowColor: '#1B1B1B',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  heroContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.greenDark,
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    color: C.accent,
    lineHeight: 18,
    marginBottom: 12,
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  heroStatusTxt: { fontSize: 12, fontWeight: '600', color: C.greenDark },
  heroImg: {
    width: 140,
    height: 180,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },

  /* Safe Zone Banner */
  safeZoneBanner: {
    marginHorizontal: 20,
    marginTop: 14,
  },
  safeZoneInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F7FA',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2.5,
    borderColor: '#1B1B1B',
    shadowColor: '#1B1B1B',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  safeZoneImg: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#1B1B1B',
  },
  safeZoneText: { flex: 1 },
  safeZoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.green,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: '#1B1B1B',
  },
  safeZoneBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '700', marginLeft: 4 },
  safeZoneTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  safeZoneSub: { fontSize: 11, color: C.textSecondary, lineHeight: 15 },

  /* SOS Button */
  sosSection: { alignItems: 'center', marginTop: 22, marginBottom: 4 },
  sosBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: C.red,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1B1B1B',
    shadowColor: '#1B1B1B',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  sosLabel: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 2, marginTop: 2 },
  sosHint: { color: C.textSecondary, fontSize: 11, marginTop: 8 },

  /* Stats Row */
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF9C4',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#1B1B1B',
    shadowColor: '#1B1B1B',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statNum: { fontSize: 20, fontWeight: '800', color: C.green },
  statLabel: { fontSize: 11, color: C.textSecondary, fontWeight: '500', marginTop: 4 },

  /* Sections */
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 19, color: C.text, fontWeight: '900', marginBottom: 14, letterSpacing: -0.3 },

  /* Feature Grid */
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: (SW - 52) / 2,
    height: 118,
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#1B1B1B',
    shadowColor: '#1B1B1B',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  featureCardWide: {
    width: SW - 40,
    height: 122,
  },
  featureContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  featureTop: {
    minHeight: 52,
    justifyContent: 'flex-start',
  },
  featureBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  featureIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1B1B1B',
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  featureSub: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    color: '#374151',
    marginTop: 6,
  },
  patternWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  patternRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: 999,
  },
  patternRing1: { width: 64, height: 64, right: -8, top: 10 },
  patternRing2: { width: 88, height: 88, right: -20, top: -2 },
  patternRing3: { width: 112, height: 112, right: -34, top: -14 },
  patternLine: {
    position: 'absolute',
    width: 90,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
    transform: [{ rotate: '-35deg' }],
  },
  patternLine1: { right: -26, top: 26 },
  patternLine2: { right: -12, top: 42 },
  patternLine3: { right: 2, top: 58 },
  patternLine4: { right: 16, top: 74 },
  patternArc: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 16,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  patternArc1: { width: 54, height: 54, right: -8, top: 16 },
  patternArc2: { width: 72, height: 72, right: -16, top: 8 },
  patternArc3: { width: 92, height: 92, right: -26, top: -2 },
  patternGridLineV: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  patternGridLineH: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  /* Alert Strip */
  alertStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FECACA',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2.5,
    borderColor: '#1B1B1B',
    shadowColor: '#1B1B1B',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  alertIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertStripTxt: { flex: 1, color: C.red, fontSize: 13, fontWeight: '600', marginLeft: 10 },

  /* Tips */
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 2.5,
    borderColor: '#1B1B1B',
    shadowColor: '#1B1B1B',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  tipDot: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#1B1B1B',
    backgroundColor: '#fff',
  },
  tipTxt: { flex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 18 },

  /* Bottom Tabs */
  bottomTabsOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    alignItems: 'center',
  },
  bottomTabsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 6,
    borderWidth: 2,
    borderColor: '#111827',
    shadowColor: '#111827',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  bottomTabActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#A3E635',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#1B1B1B',
  },
  bottomTabActiveText: {
    color: '#1B1B1B',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bottomTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bottomTabText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
