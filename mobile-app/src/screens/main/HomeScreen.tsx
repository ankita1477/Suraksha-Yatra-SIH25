import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Animated, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import useAuthStore from '../../state/authStore';
import socketService from '../../services/socketService';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { colors, typography, spacing, commonStyles, borderRadius, shadows } from '../../utils/theme';
import { wp, hp, isSmallDevice, TOUCH_TARGET_SIZE } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  startLocationTracking, 
  stopLocationTracking, 
  isLocationTrackingActive,
  getLocationStatus 
} from '../../services/locationService';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const [socketConnected, setSocketConnected] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<number>(0);
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
        {/* Hero Section with Dark Theme Gradient */}
        <Animated.View 
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>{getGreeting()}</Text>
                <Text style={styles.userName}>
                  {user?.email?.split('@')[0] || 'Traveler'} 👋
                </Text>
              </View>
              
              <View style={styles.heroStats}>
                <View style={styles.statItem}>
                  <Ionicons 
                    name={socketConnected ? "shield-checkmark" : "shield-outline"} 
                    size={24} 
                    color="white" 
                  />
                  <Text style={styles.statLabel}>
                    {socketConnected ? 'Protected' : 'Offline'}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons 
                    name={locationStatus.isTracking ? "location" : "location-outline"} 
                    size={24} 
                    color="white" 
                  />
                  <Text style={styles.statLabel}>
                    {locationStatus.isTracking ? 'Tracking' : 'Paused'}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Alert Banner */}
        {recentAlerts > 0 && (
          <Animated.View style={[styles.alertBanner, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={['#ff9a56', '#ff6b6b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.alertGradient}
            >
              <Ionicons name="warning" size={20} color="white" />
              <Text style={styles.alertText}>
                {recentAlerts} recent alert{recentAlerts > 1 ? 's' : ''} in your area
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Map')}>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Quick Actions Grid */}
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
    height: hp(25),
    marginBottom: spacing.lg,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  heroContent: {
    alignItems: 'center',
  },
  greetingContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greetingText: {
    ...typography.body,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
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
    marginTop: spacing.xs,
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
});
