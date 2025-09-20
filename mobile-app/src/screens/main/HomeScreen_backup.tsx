import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Animated, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import useAuthStore from '../../state/authStore';
import socketService from '../../services/socketService';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { colors, typography, spacing, commonStyles, borderRadius, shadows } from '../../utils/theme';
import { wp, hp, isSmallDevice, TOUCH_TARGET_SIZE, normalize } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  startLocationTracking, 
  stopLocationTracking, 
  isLocationTrackingActive,
  getLocationStatus 
} from '../../services/locationService';
import AISimpleStatus from '../../components/AISimpleStatus';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const [socketConnected, setSocketConnected] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<number>(0);
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState({
    hasPermission: false,
    isTracking: false,
    backgroundEnabled: false
  });

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    // Initialize socket connection with error handling
    const initializeSocket = async () => {
      try {
        await socketService.connect();
        setSocketConnected(socketService.isConnected());
      } catch (error) {
        console.error('Socket connection failed:', error);
        setSocketConnected(false);
      }
    };

    // Initialize location tracking with error handling
    const initializeLocation = async () => {
      try {
        await initializeLocationTracking();
      } catch (error) {
        console.error('Location initialization failed:', error);
      }
    };

    // Initialize services
    initializeSocket();
    initializeLocation();

    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Listen for real-time alerts
    const handlePanicAlert = (data: any) => {
      setRecentAlerts(prev => prev + 1);
      Alert.alert(
        '🚨 Safety Alert',
        'A panic alert was triggered in your area. Check the map for details.',
        [{ text: 'View Map', onPress: () => navigation.navigate('Map') }, { text: 'OK' }]
      );
    };

    const handleIncident = (data: any) => {
      setRecentAlerts(prev => prev + 1);
      if (data.severity === 'high' || data.severity === 'critical') {
        Alert.alert(
          '⚠️ Safety Warning',
          `${data.type} incident detected: ${data.description || 'Please stay alert.'}`,
          [{ text: 'View Map', onPress: () => navigation.navigate('Map') }, { text: 'OK' }]
        );
      }
    };

    socketService.on('panic_alert', handlePanicAlert);
    socketService.on('incident', handleIncident);

    // Check connection status periodically
    const connectionInterval = setInterval(() => {
      setSocketConnected(socketService.isConnected());
      updateLocationStatus();
    }, 5000);

    return () => {
      socketService.off('panic_alert', handlePanicAlert);
      socketService.off('incident', handleIncident);
      clearInterval(connectionInterval);
      // Clean up location tracking on unmount
      stopLocationTracking();
    };
  }, [navigation]);

  const initializeLocationTracking = async () => {
    try {
      const success = await startLocationTracking(
        (location, response) => {
          console.log('Location updated:', location.coords);
          // Update current location for AI safety status
          setCurrentLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude
          });
          if (response?.anomaly) {
            setRecentAlerts(prev => prev + 1);
          }
        },
        {
          timeInterval: 30000, // 30 seconds
          distanceInterval: 100, // 100 meters
        }
      );
      
      if (success) {
        console.log('Location tracking started successfully');
      } else {
        console.log('Location tracking failed to start');
      }
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      // Don't crash the app, just log the error
    }
    
    // Update initial status
    try {
      updateLocationStatus();
    } catch (error) {
      console.error('Failed to update location status:', error);
    }
  };

  const updateLocationStatus = async () => {
    try {
      const status = await getLocationStatus();
      setLocationStatus(status);
    } catch (error) {
      console.error('Failed to get location status:', error);
    }
  };

  const toggleLocationTracking = async () => {
    if (locationStatus.isTracking) {
      await stopLocationTracking();
      Alert.alert('Location Tracking', 'Location tracking has been stopped.');
    } else {
      const success = await startLocationTracking();
      if (success) {
        Alert.alert('Location Tracking', 'Location tracking has been started.');
      } else {
        Alert.alert('Error', 'Failed to start location tracking. Please check permissions.');
      }
    }
    updateLocationStatus();
  };

  const handleEmergencyTest = () => {
    Alert.alert(
      'Emergency Test',
      'This will trigger a test panic alert. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Test', onPress: () => navigation.navigate('Panic') }
      ]
    );
  };

  return (
    <SafeAreaWrapper backgroundColor={colors.background} statusBarStyle="light-content">
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingTitle}>Welcome back,</Text>
            <Text style={styles.userName}>
              {user?.email?.split('@')[0] || 'Traveler'} 👋
            </Text>
          </View>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchInput}>
              <Text style={styles.searchPlaceholder}>Search safety features...</Text>
              <View style={styles.searchIcon}>
                <Ionicons name="search" size={20} color={colors.textInverse} />
              </View>
            </View>
          </View>
        </View>

        {/* Colorful Action Cards Grid (like reference image) */}
        <View style={styles.cardsGrid}>
          <View style={styles.cardRow}>
            <TouchableOpacity 
              style={[styles.modernActionCard, { backgroundColor: colors.cardPink }]}
              onPress={() => navigation.navigate('EmergencyContacts')}
            >
              <Text style={styles.cardTitle}>Emergency{'\n'}contacts</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modernActionCard, { backgroundColor: colors.cardYellow }]}
              onPress={() => navigation.navigate('Map')}
            >
              <Text style={styles.cardTitle}>Safe zone{'\n'}finder</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.modernActionCard, styles.wideCard, { backgroundColor: colors.cardPurple }]}
            onPress={() => navigation.navigate('Panic')}
          >
            <Text style={styles.cardTitle}>Panic alert</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* AI Safety Status */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <AISimpleStatus 
            currentLocation={currentLocation || undefined} 
            onViewDetails={() => {
              // Simple alert for now
              Alert.alert(
                'AI Safety Guard',
                'AI is continuously monitoring your area for potential risks and keeping you safe.',
                [{ text: 'OK' }]
              );
            }}
          />
        </Animated.View>

        {/* Alert Banner */}
        {recentAlerts > 0 && (
          <Animated.View style={[styles.alertBanner, { opacity: fadeAnim }]}>
            <View style={[styles.alertCard, { backgroundColor: colors.error }]}>
              <Ionicons name="warning" size={20} color="white" />
              <Text style={styles.alertText}>
                {recentAlerts} recent alert{recentAlerts > 1 ? 's' : ''} in your area
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Map')}>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Main Action Cards */}
        <View style={styles.cardsGrid}>
          <TouchableOpacity 
            style={[styles.modernActionCard, styles.wideCard, { backgroundColor: colors.cardPurple }]}
            onPress={() => navigation.navigate('Map')}
          >
            <View>
              <Text style={styles.cardTitle}>Safe Map</Text>
              <Text style={styles.cardSubtitle}>Find safe zones nearby</Text>
            </View>
            <Ionicons name="map" size={24} color={colors.textInverse} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modernActionCard, styles.wideCard, { backgroundColor: colors.cardPink }]}
            onPress={() => navigation.navigate('Panic')}
          >
            <View>
              <Text style={styles.cardTitle}>Emergency Alert</Text>
              <Text style={styles.cardSubtitle}>Quick panic button</Text>
            </View>
            <Ionicons name="warning" size={24} color={colors.textInverse} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modernActionCard, styles.wideCard, { backgroundColor: colors.cardYellow }]}
            onPress={() => navigation.navigate('EmergencyContacts')}
          >
            <View>
              <Text style={styles.cardTitle}>Settings</Text>
              <Text style={styles.cardSubtitle}>Emergency contacts & more</Text>
            </View>
            <Ionicons name="settings" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <Animated.View 
          style={[
            styles.actionsSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.primaryActions}>
            {/* Emergency Button - Large */}
            <TouchableOpacity 
              style={styles.emergencyCard}
              onPress={() => navigation.navigate('Panic')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ff4757', '#c44569']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emergencyGradient}
              >
                <Ionicons name="warning" size={32} color="white" />
                <Text style={styles.emergencyText}>EMERGENCY</Text>
                <Text style={styles.emergencySubtext}>Tap for immediate help</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Location Toggle */}
            <TouchableOpacity 
              style={styles.locationCard}
              onPress={toggleLocationTracking}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={locationStatus.isTracking 
                  ? ['#5f27cd', '#341f97'] 
                  : ['#636e72', '#2d3436']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.locationGradient}
              >
                <Ionicons 
                  name={locationStatus.isTracking ? "location" : "location-outline"} 
                  size={28} 
                  color="white" 
                />
                <Text style={styles.locationText}>
                  {locationStatus.isTracking ? 'Stop Tracking' : 'Start Tracking'}
                </Text>
                <Text style={styles.locationSubtext}>
                  {locationStatus.isTracking ? 'Location active' : 'Enable safety tracking'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Secondary Actions Grid */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Map')}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <LinearGradient
                  colors={['#00b894', '#00a085']}
                  style={styles.actionIconGradient}
                >
                  <Ionicons name="map" size={24} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.actionTitle}>Safety Map</Text>
              <Text style={styles.actionSubtitle}>View incidents & safe zones</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('EmergencyContacts')}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <LinearGradient
                  colors={['#0984e3', '#0662c7']}
                  style={styles.actionIconGradient}
                >
                  <Ionicons name="people" size={24} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.actionTitle}>Contacts</Text>
              <Text style={styles.actionSubtitle}>Manage emergency contacts</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={handleEmergencyTest}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <LinearGradient
                  colors={['#fdcb6e', '#e17055']}
                  style={styles.actionIconGradient}
                >
                  <Ionicons name="flask" size={24} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.actionTitle}>Test Alert</Text>
              <Text style={styles.actionSubtitle}>Test emergency system</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('NotificationSettings')}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <LinearGradient
                  colors={['#a29bfe', '#6c5ce7']}
                  style={styles.actionIconGradient}
                >
                  <Ionicons name="notifications" size={24} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.actionTitle}>Settings</Text>
              <Text style={styles.actionSubtitle}>Configure notifications</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Safety Tips Section */}
        <Animated.View 
          style={[
            styles.tipsSection,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.sectionTitle}>Safety Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color={colors.warning} />
            <Text style={styles.tipText}>
              Keep your location tracking enabled for better safety coverage
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="time" size={20} color={colors.success} />
            <Text style={styles.tipText}>
              Update your emergency contacts regularly
            </Text>
          </View>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View style={[styles.logoutSection, { opacity: fadeAnim }]}>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color={colors.errorLight} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Hero Section
  heroSection: {
    marginBottom: spacing.lg,
  },
  heroCard: {
    minHeight: hp(20),
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.md,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  greetingContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greetingText: {
    ...typography.bodyLarge,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.heading2,
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: spacing.md,
  },
  statLabel: {
    ...typography.caption,
    color: 'white',
    fontWeight: '600',
  },

  // Alert Banner
  alertBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  alertGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  alertText: {
    ...typography.bodyMedium,
    color: 'white',
    flex: 1,
    marginLeft: spacing.sm,
  },

  // Actions Section
  actionsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.text,
    marginBottom: spacing.lg,
    fontWeight: '700',
  },

  // Primary Actions
  primaryActions: {
    marginBottom: spacing.lg,
  },
  emergencyCard: {
    height: hp(15),
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(255, 71, 87, 0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 8,
  },
  emergencyGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emergencyText: {
    ...typography.heading2,
    color: 'white',
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  emergencySubtext: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.xs,
  },

  locationCard: {
    height: hp(12),
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(59, 130, 246, 0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 6,
  },
  locationGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  locationText: {
    ...typography.bodyMedium,
    color: 'white',
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  locationSubtext: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Secondary Actions
  secondaryActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    ...commonStyles.glassCardDark,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  actionIconContainer: {
    marginBottom: spacing.md,
  },
  actionIconGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  actionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Tips Section
  tipsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    ...commonStyles.glassCardDark,
    marginBottom: spacing.sm,
  },
  tipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 18,
  },

  // Logout Section
  logoutSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    ...typography.bodyMedium,
    color: colors.errorLight,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },

  // Dark Theme Header Styles (like reference image)
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  timeText: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  premiumButton: {
    backgroundColor: colors.cardPurple,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  premiumText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
  },
  greetingTitle: {
    ...typography.heading1,
    color: colors.text,
    fontWeight: '600',
    lineHeight: normalize(38),
  },
  searchContainer: {
    marginTop: spacing.lg,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  searchPlaceholder: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    flex: 1,
  },
  searchIcon: {
    backgroundColor: colors.cardYellow,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },

  // Modern Card Grid Styles (like reference image)
  cardsGrid: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modernActionCard: {
    flex: 1,
    backgroundColor: colors.cardPink,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.xs,
    minHeight: hp(12),
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  wideCard: {
    marginHorizontal: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...typography.bodyMedium,
    color: colors.textInverse,
    fontWeight: '600',
    lineHeight: 20,
  },
});
