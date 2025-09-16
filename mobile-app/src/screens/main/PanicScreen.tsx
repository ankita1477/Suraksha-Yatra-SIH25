import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { sendPanicAlert as sendPanicAlertAPI } from '../../services/alertsService';
import { sendEmergencyNotification } from '../../services/notificationService';

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Alert</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoContainer}>
          <Ionicons name="warning" size={48} color="#FF6B6B" />
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
              color={locationPermission ? "#4CAF50" : "#FF6B6B"} 
            />
            <Text style={[styles.statusText, { 
              color: locationPermission ? "#4CAF50" : "#FF6B6B" 
            }]}>
              Location: {locationPermission ? "Enabled" : "Disabled"}
            </Text>
          </View>
        </View>

        <View style={styles.panicButtonContainer}>
          <TouchableOpacity
            style={styles.panicButton}
            onPress={handlePanicPress}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <>
                <Ionicons name="alert-circle" size={64} color="white" />
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  infoDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  statusText: {
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
  panicButtonContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  panicButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FF4757',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  panicButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  panicButtonSubtext: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 5,
  },
  emergencyInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  emergencyInfoItem: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
    lineHeight: 20,
  },
});