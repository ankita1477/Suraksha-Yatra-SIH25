import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { sendPanicAlert as sendPanicAlertAPI } from '../../services/alertsService';
import { sendEmergencyNotification } from '../../services/notificationService';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';

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
  redDark: '#991B1B',
  redPale: '#FECACA',
  yellowPale: '#FEF3C7',
};

type Props = NativeStackScreenProps<RootStackParamList, 'Panic'>;

export default function PanicScreen({ navigation }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    checkLocationPermission();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();

    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulseRef.current.start();

    return () => {
      pulseRef.current?.stop();
    };
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    } catch {
      setLocationPermission(false);
    }
  };

  const handlePanicPress = () => {
    Alert.alert(
      'Emergency Alert',
      'This will send an emergency alert to authorities and emergency contacts. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Alert', style: 'destructive', onPress: sendPanicAlert },
      ]
    );
  };

  const sendPanicAlert = async () => {
    setIsLoading(true);
    Vibration.vibrate([500, 180, 450]);

    try {
      let location = null;
      if (locationPermission) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
      }

      const panicPayload = {
        lat: location?.coords.latitude || 0,
        lng: location?.coords.longitude || 0,
        timestamp: new Date().toISOString(),
      };

      await sendPanicAlertAPI(panicPayload);
      await sendEmergencyNotification('panic', {
        latitude: panicPayload.lat,
        longitude: panicPayload.lng,
      });

      Alert.alert('Alert Sent', 'Emergency alert has been sent. Help is on the way.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      let errorMessage = 'Failed to send emergency alert. Try again or call emergency services directly.';

      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Authentication error. Please log in again.';
        }
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaWrapper backgroundColor={C.bg} statusBarStyle="dark-content">
      <Animated.View style={[s.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={C.text} />
            </TouchableOpacity>
            <View>
              <Text style={s.headerTitle}>Emergency Alert</Text>
              <Text style={s.headerSub}>Tap once to send emergency signal</Text>
            </View>
          </View>
          <View style={s.warnChip}>
            <Ionicons name="warning" size={16} color={C.red} />
          </View>
        </View>

        <ScrollView style={s.content} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={s.alertCard}>
            <View style={s.alertPatternWrap}>
              <View style={[s.alertRing, s.alertRing1]} />
              <View style={[s.alertRing, s.alertRing2]} />
              <View style={[s.alertRing, s.alertRing3]} />
            </View>
            <Ionicons name="alert-circle" size={44} color={C.redDark} />
            <Text style={s.alertTitle}>Panic Button</Text>
            <Text style={s.alertDescription}>
              Use this only in immediate danger. It sends your live location to emergency contacts and services.
            </Text>
          </View>

          <View style={s.statusCard}>
            <Text style={s.cardTitle}>System Status</Text>
            <View style={s.statusRow}>
              <View style={[s.statusIcon, { backgroundColor: locationPermission ? C.greenPale : C.redPale }]}>
                <Ionicons
                  name={locationPermission ? 'location' : 'location-outline'}
                  size={18}
                  color={locationPermission ? C.green : C.red}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.statusLabel}>Location Services</Text>
                <Text style={[s.statusValue, { color: locationPermission ? C.green : C.red }]}>
                  {locationPermission ? 'Active' : 'Disabled'}
                </Text>
              </View>
              <View style={[s.statusDot, { backgroundColor: locationPermission ? C.green : C.red }]} />
            </View>
          </View>

          <View style={s.emergencyWrap}>
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <TouchableOpacity
                style={[s.emergencyBtn, isLoading && s.emergencyBtnDisabled]}
                onPress={handlePanicPress}
                disabled={isLoading}
                activeOpacity={0.82}
              >
                {isLoading ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="alert-circle" size={56} color="#FFFFFF" />
                    <Text style={s.emergencyBtnText}>EMERGENCY</Text>
                    <Text style={s.emergencyBtnSub}>Tap to activate</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={s.infoCard}>
            <Text style={s.cardTitle}>What Happens Next</Text>

            {[
              { icon: 'location', text: 'Your exact location is shared instantly' },
              { icon: 'people', text: 'Emergency contacts are notified' },
              { icon: 'shield-checkmark', text: 'Authorities are alerted' },
              { icon: 'radio', text: 'Live tracking is activated' },
            ].map((item, idx) => (
              <View key={idx} style={s.infoRow}>
                <View style={s.infoIconWrap}>
                  <Ionicons name={item.icon as any} size={15} color={C.green} />
                </View>
                <Text style={s.infoText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaWrapper>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
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
    color: C.text,
    fontSize: 22,
    fontWeight: '800',
  },
  headerSub: {
    color: C.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  warnChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.redPale,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.border,
    shadowColor: C.border,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },

  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },

  alertCard: {
    backgroundColor: C.yellowPale,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: C.border,
    shadowColor: C.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  alertPatternWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  alertRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(180, 83, 9, 0.25)',
    borderRadius: 999,
  },
  alertRing1: { width: 120, height: 120, right: -18, top: -14 },
  alertRing2: { width: 88, height: 88, right: -2, top: 2 },
  alertRing3: { width: 62, height: 62, right: 14, top: 18 },
  alertTitle: {
    marginTop: 8,
    marginBottom: 6,
    color: C.redDark,
    fontSize: 20,
    fontWeight: '800',
    zIndex: 2,
  },
  alertDescription: {
    textAlign: 'center',
    lineHeight: 20,
    color: '#92400E',
    fontSize: 14,
    zIndex: 2,
  },

  statusCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 2.5,
    borderColor: C.border,
    shadowColor: C.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.border,
    marginRight: 10,
  },
  statusLabel: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  emergencyWrap: {
    alignItems: 'center',
    marginVertical: 20,
  },
  emergencyBtn: {
    width: 212,
    height: 212,
    borderRadius: 106,
    backgroundColor: C.red,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: C.border,
    shadowColor: C.border,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  emergencyBtnDisabled: {
    opacity: 0.72,
    backgroundColor: '#6B7280',
  },
  emergencyBtnText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 10,
    letterSpacing: 0.8,
  },
  emergencyBtnSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },

  infoCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2.5,
    borderColor: C.border,
    shadowColor: C.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: C.greenPale,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.border,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    color: C.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
