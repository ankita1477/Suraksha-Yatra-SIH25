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
