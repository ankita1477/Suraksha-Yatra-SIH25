import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { sendPanicAlert as sendPanicAlertAPI } from '../../services/alertsService';
import { sendEmergencyNotification } from '../../services/notificationService';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { colors, typography, spacing, commonStyles, borderRadius, shadows } from '../../utils/theme';
import { wp, hp, isSmallDevice, TOUCH_TARGET_SIZE, normalize } from '../../utils/responsive';

interface PanicScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

export const PanicScreen: React.FC<PanicScreenProps> = ({ navigation }: PanicScreenProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];
  const emergencyPulse = useState(new Animated.Value(1))[0];
  const warningFlash = useState(new Animated.Value(0))[0];

  useEffect(() => {
    checkLocationPermission();
    
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Start continuous animations
    startEmergencyPulse();
    startWarningFlash();
  }, []);

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

  const startWarningFlash = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(warningFlash, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(warningFlash, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const handlePanicPress = async () => {
    // Immediate feedback animation
    Animated.sequence([
      Animated.timing(emergencyPulse, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(emergencyPulse, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Alert.alert(
      '🚨 Emergency Alert',
      'This will send an emergency alert to authorities and emergency contacts. Are you sure?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            // Reset animation
            Animated.timing(emergencyPulse, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: sendPanicAlert
        }
      ]
    );
  };

  const sendPanicAlert = async () => {
    setIsLoading(true);
    Vibration.vibrate([500, 200, 500]);
    
    try {
      let location = null;
      if (locationPermission) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
      }

      // Send panic alert to backend
      const panicPayload = {
        lat: location?.coords.latitude || 0,
        lng: location?.coords.longitude || 0,
        timestamp: new Date().toISOString()
      };

      await sendPanicAlertAPI(panicPayload);

      // Send local notification
      await sendEmergencyNotification('panic', {
        latitude: location?.coords.latitude || 0,
        longitude: location?.coords.longitude || 0,
      });

      Alert.alert(
        'Alert Sent',
        'Emergency alert has been sent successfully. Help is on the way.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      console.error('Error sending panic alert:', error);
      
      let errorMessage = 'Failed to send emergency alert. Please try again or contact emergency services directly.';
      
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
    <SafeAreaWrapper backgroundColor={colors.background} statusBarStyle="light-content">
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Header - HomeScreen Style */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Emergency Alert</Text>
              <Text style={styles.headerSubtitle}>Tap to send emergency signal</Text>
            </View>
            
            <Animated.View 
              style={[
                styles.warningIndicator,
                {
                  opacity: warningFlash.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1]
                  })
                }
              ]}
            >
              <Ionicons name="warning" size={20} color="#dc2626" />
            </Animated.View>
          </View>
        </Animated.View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Emergency Alert Card */}
          <Animated.View 
            style={[
              styles.alertCard,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <LinearGradient
              colors={['#fef3c7', '#f59e0b']}
              style={styles.alertGradient}
            >
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Ionicons name="warning" size={48} color="#b45309" />
              </Animated.View>
              <Text style={styles.alertTitle}>Emergency Panic Button</Text>
              <Text style={styles.alertDescription}>
                Press the emergency button below in case of immediate danger. 
                This will alert authorities and emergency contacts with your exact location.
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Status Section */}
          <Animated.View 
            style={[
              styles.statusCard,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.statusTitle}>System Status</Text>
            <View style={styles.statusItem}>
              <View style={styles.statusIconContainer}>
                <Ionicons 
                  name={locationPermission ? "location" : "location-outline"} 
                  size={20} 
                  color={locationPermission ? colors.success : colors.error} 
                />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusLabel}>Location Services</Text>
                <Text style={[styles.statusValue, { 
                  color: locationPermission ? colors.success : colors.error 
                }]}>
                  {locationPermission ? "Active" : "Disabled"}
                </Text>
              </View>
              <View style={[
                styles.statusDot, 
                { backgroundColor: locationPermission ? colors.success : colors.error }
              ]} />
            </View>
          </Animated.View>

          {/* Emergency Button */}
          <Animated.View 
            style={[
              styles.emergencyButtonContainer,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.emergencyButton,
                isLoading && styles.emergencyButtonDisabled,
                { transform: [{ scale: emergencyPulse }] }
              ]}
              onPress={handlePanicPress}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? ['#6b7280', '#4b5563'] : ['#dc2626', '#991b1b']}
                style={styles.emergencyGradient}
              >
                {isLoading ? (
                  <ActivityIndicator size="large" color="white" />
                ) : (
                  <>
                    <Animated.View style={{ 
                      transform: [{ 
                        rotate: emergencyPulse.interpolate({
                          inputRange: [1, 1.1],
                          outputRange: ['0deg', '10deg']
                        }) 
                      }] 
                    }}>
                      <Ionicons name="alert-circle" size={64} color="white" />
                    </Animated.View>
                    <Text style={styles.emergencyButtonText}>EMERGENCY</Text>
                    <Text style={styles.emergencyButtonSubtext}>Tap to activate</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Info Section */}
          <Animated.View 
            style={[
              styles.infoCard,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.infoTitle}>What happens when you activate:</Text>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="location" size={16} color={colors.primary} />
              </View>
              <Text style={styles.infoText}>Your exact location is sent to authorities</Text>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="people" size={16} color={colors.primary} />
              </View>
              <Text style={styles.infoText}>Emergency contacts are notified immediately</Text>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
              </View>
              <Text style={styles.infoText}>Security personnel are dispatched</Text>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="radio" size={16} color={colors.primary} />
              </View>
              <Text style={styles.infoText}>Real-time tracking is activated</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header Section - HomeScreen Style
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  headerTitle: {
    ...typography.heading2,
    color: colors.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  warningIndicator: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  
  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  
  // Alert Card
  alertCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  alertGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  alertTitle: {
    ...typography.heading2,
    color: '#b45309',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
    fontWeight: '700',
  },
  alertDescription: {
    ...typography.body,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Status Card
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statusTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  statusValue: {
    ...typography.caption,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Emergency Button
  emergencyButtonContainer: {
    alignItems: 'center',
    marginVertical: spacing.xxl,
  },
  emergencyButton: {
    width: isSmallDevice() ? wp(60) : wp(55),
    height: isSmallDevice() ? wp(60) : wp(55),
    borderRadius: isSmallDevice() ? wp(30) : wp(27.5),
    overflow: 'hidden',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 12,
  },
  emergencyButtonDisabled: {
    opacity: 0.6,
  },
  emergencyGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyButtonText: {
    ...typography.heading2,
    color: 'white',
    marginTop: spacing.md,
    fontWeight: '800',
    fontSize: normalize(24),
  },
  emergencyButtonSubtext: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.xs,
  },
  
  // Info Card
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  infoTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});

export default PanicScreen;