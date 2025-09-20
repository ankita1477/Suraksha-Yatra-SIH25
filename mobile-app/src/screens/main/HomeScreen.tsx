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
  const pulseAnim = useState(new Animated.Value(1))[0];
  const emergencyPulse = useState(new Animated.Value(1))[0];
  const aiStatusAnim = useState(new Animated.Value(0))[0];

  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Animation functions
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startEmergencyPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(emergencyPulse, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(emergencyPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleCardPress = (navigation: any, route: string) => {
    // Create a bounce animation for feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate(route);
    });
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
      Animated.timing(aiStatusAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Start continuous animations
    startPulseAnimation();
    startEmergencyPulse();

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
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.greetingContainer}>
            <Animated.Text 
              style={[
                styles.greetingTitle,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              {getGreeting()},
            </Animated.Text>
            <Text style={styles.userName}>
              {user?.email?.split('@')[0] || 'Traveler'} 👋
            </Text>
          </View>
          
          {/* AI Safety Guard - Small Header Version */}
          <Animated.View 
            style={[
              styles.aiStatusHeader,
              {
                opacity: aiStatusAnim,
                transform: [{ scale: aiStatusAnim }]
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.aiStatusContainer}
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert(
                  'AI Safety Guard',
                  'AI is continuously monitoring your area for potential risks and keeping you safe.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <View style={styles.aiIconContainer}>
                <Animated.View style={{ transform: [{ rotate: pulseAnim.interpolate({
                  inputRange: [1, 1.05],
                  outputRange: ['0deg', '5deg']
                }) }] }}>
                  <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                </Animated.View>
              </View>
              <View style={styles.aiStatusText}>
                <Text style={styles.aiStatusTitle}>AI Safety Guard</Text>
                <Text style={styles.aiStatusSubtitle}>
                  {currentLocation ? 'Monitoring your area' : 'Waiting for location'}
                </Text>
              </View>
              <View style={styles.aiStatusIndicator}>
                <Animated.View 
                  style={[
                    styles.statusDot, 
                    { 
                      backgroundColor: currentLocation ? '#4CAF50' : '#FFC107',
                      transform: [{ scale: pulseAnim }]
                    }
                  ]} 
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Emergency Button Circle */}
        <Animated.View 
          style={[
            styles.emergencyButtonContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={[
              styles.emergencyButton,
              {
                transform: [{ scale: emergencyPulse }]
              }
            ]}
            onPress={() => {
              // Haptic feedback
              Animated.sequence([
                Animated.timing(emergencyPulse, {
                  toValue: 0.9,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(emergencyPulse, {
                  toValue: 1.1,
                  duration: 100,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                navigation.navigate('Panic');
              });
            }}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ rotate: emergencyPulse.interpolate({
              inputRange: [1, 1.1],
              outputRange: ['0deg', '10deg']
            }) }] }}>
              <Ionicons name="warning" size={40} color="white" />
            </Animated.View>
            <Text style={styles.emergencyButtonText}>EMERGENCY</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* All Action Cards Grid */}
        <Animated.View 
          style={[
            styles.cardsGrid,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.cardRow}>
            <TouchableOpacity 
              style={[styles.modernActionCard, { backgroundColor: colors.cardPink }]}
              onPress={() => handleCardPress(navigation, 'EmergencyContacts')}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Animated.View style={{ transform: [{ rotate: pulseAnim.interpolate({
                  inputRange: [1, 1.05],
                  outputRange: ['0deg', '5deg']
                }) }] }}>
                  <Ionicons name="people" size={24} color={colors.textInverse} />
                </Animated.View>
                <Text style={styles.cardTitle}>Emergency{'\n'}contacts</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modernActionCard, { backgroundColor: colors.cardYellow }]}
              onPress={() => handleCardPress(navigation, 'Map')}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Ionicons name="shield-checkmark" size={24} color={colors.textInverse} />
                </Animated.View>
                <Text style={styles.cardTitle}>Safe zone{'\n'}finder</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.cardRow}>
            <TouchableOpacity 
              style={[styles.modernActionCard, { backgroundColor: colors.cardPurple }]}
              onPress={() => handleCardPress(navigation, 'Panic')}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Animated.View style={{ transform: [{ rotate: emergencyPulse.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: ['0deg', '15deg']
                }) }] }}>
                  <Ionicons name="alert-circle" size={24} color={colors.textInverse} />
                </Animated.View>
                <Text style={styles.cardTitle}>Panic{'\n'}alert</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modernActionCard, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleCardPress(navigation, 'Map')}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <Ionicons name="map" size={24} color={colors.textInverse} />
                </Animated.View>
                <Text style={styles.cardTitle}>Safety{'\n'}map</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.cardRow}>
            <TouchableOpacity 
              style={[styles.modernActionCard, { backgroundColor: '#FF5722' }]}
              onPress={() => handleCardPress(navigation, 'Panic')}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Animated.View style={{ transform: [{ rotate: emergencyPulse.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: ['0deg', '-10deg']
                }) }] }}>
                  <Ionicons name="warning" size={24} color={colors.textInverse} />
                </Animated.View>
                <Text style={styles.cardTitle}>Emergency{'\n'}alert</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modernActionCard, { backgroundColor: '#607D8B' }]}
              onPress={() => handleCardPress(navigation, 'NotificationSettings')}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Animated.View style={{ transform: [{ rotate: pulseAnim.interpolate({
                  inputRange: [1, 1.05],
                  outputRange: ['0deg', '360deg']
                }) }] }}>
                  <Ionicons name="settings" size={24} color={colors.textInverse} />
                </Animated.View>
                <Text style={styles.cardTitle}>Settings</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
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

  // Dark Theme Header Styles
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  greetingTitle: {
    ...typography.heading1,
    color: colors.text,
    fontWeight: '600',
    lineHeight: normalize(38),
  },
  userName: {
    ...typography.heading2,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  
  // AI Status in Header
  aiStatusHeader: {
    marginTop: spacing.lg,
  },
  aiStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  aiIconContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  aiStatusText: {
    flex: 1,
  },
  aiStatusTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  aiStatusSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  aiStatusIndicator: {
    marginLeft: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },

  // Modern Card Grid Styles
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
  cardContent: {
    alignItems: 'flex-start',
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
  cardSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(0, 0, 0, 0.7)',
    fontWeight: '400',
    marginTop: 2,
  },

  // Emergency Button Circle Styles
  emergencyButtonContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emergencyButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF4757',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emergencyButtonText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '700',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
