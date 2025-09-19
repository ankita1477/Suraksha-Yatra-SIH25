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
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { sendPanicAlert as sendPanicAlertAPI } from '../../services/alertsService';
import { sendEmergencyNotification } from '../../services/notificationService';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { colors, typography, spacing, commonStyles, borderRadius, shadows } from '../../utils/theme';
import { wp, hp, isSmallDevice, TOUCH_TARGET_SIZE } from '../../utils/responsive';

interface PanicScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

export const PanicScreen: React.FC<PanicScreenProps> = ({ navigation }: PanicScreenProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const handlePanicPress = async () => {
    Alert.alert(
      'Emergency Alert',
      'This will send an emergency alert to authorities. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
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
    <SafeAreaWrapper backgroundColor={colors.error} statusBarStyle="light-content">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency Alert</Text>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoContainer}>
            <Ionicons name="warning" size={48} color={colors.warning} />
            <Text style={styles.infoTitle}>Emergency Panic Button</Text>
            <Text style={styles.infoDescription}>
              Press the button below in case of emergency. This will immediately alert authorities with your current location.
            </Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Ionicons 
                name={locationPermission ? "location" : "location-outline"} 
                size={20} 
                color={locationPermission ? colors.success : colors.error} 
              />
              <Text style={[styles.statusText, { 
                color: locationPermission ? colors.success : colors.error 
              }]}>
                Location: {locationPermission ? "Enabled" : "Disabled"}
              </Text>
            </View>
          </View>

          <View style={styles.panicButtonContainer}>
            <TouchableOpacity
              style={[styles.panicButton, isLoading && styles.panicButtonDisabled]}
              onPress={handlePanicPress}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color={colors.text} />
              ) : (
                <>
                  <Ionicons name="alert-circle" size={64} color={colors.text} />
                  <Text style={styles.panicButtonText}>EMERGENCY</Text>
                  <Text style={styles.panicButtonSubtext}>Tap to activate</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyInfoTitle}>What happens when you press this button:</Text>
            <Text style={styles.emergencyInfoItem}>• Your exact location is sent to authorities</Text>
            <Text style={styles.emergencyInfoItem}>• Emergency contacts are notified</Text>
            <Text style={styles.emergencyInfoItem}>• Security personnel are dispatched</Text>
            <Text style={styles.emergencyInfoItem}>• Real-time tracking is activated</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
    minWidth: TOUCH_TARGET_SIZE,
    minHeight: TOUCH_TARGET_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.heading3,
    color: colors.text,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  infoContainer: {
    alignItems: 'center',
    ...commonStyles.glassCardDark,
    marginBottom: spacing.lg,
  },
  infoTitle: {
    ...typography.heading2,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  infoDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  statusContainer: {
    ...commonStyles.card,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  statusText: {
    ...typography.bodyMedium,
    marginLeft: spacing.sm,
  },
  panicButtonContainer: {
    alignItems: 'center',
    marginVertical: spacing.xxl,
  },
  panicButton: {
    width: isSmallDevice() ? wp(50) : wp(45),
    height: isSmallDevice() ? wp(50) : wp(45),
    borderRadius: isSmallDevice() ? wp(25) : wp(22.5),
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 12,
  },
  panicButtonDisabled: {
    opacity: 0.6,
    backgroundColor: colors.textMuted,
  },
  panicButtonText: {
    ...typography.heading3,
    color: colors.text,
    marginTop: spacing.sm,
    fontWeight: '700',
  },
  panicButtonSubtext: {
    ...typography.caption,
    color: colors.text,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  emergencyInfo: {
    ...commonStyles.card,
    ...shadows.small,
  },
  emergencyInfoTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: spacing.md,
  },
  emergencyInfoItem: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
});

export default PanicScreen;