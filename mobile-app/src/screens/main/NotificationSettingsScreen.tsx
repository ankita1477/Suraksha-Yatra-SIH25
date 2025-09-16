import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  NotificationSettings,
  getNotificationSettings,
  updateNotificationSettings,
  clearAllNotifications,
  getNotificationHistory,
  sendLocalNotification,
} from '../../services/notificationService';

interface NotificationSettingsScreenProps {
  navigation: {
    goBack: () => void;
  };
}

export default function NotificationSettingsScreen({ navigation }: NotificationSettingsScreenProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    panicAlerts: true,
    incidentNotifications: true,
    locationSharing: true,
    safetyAlerts: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    loadSettings();
    loadNotificationHistory();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await getNotificationSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationHistory = async () => {
    try {
      const history = await getNotificationHistory();
      setNotificationCount(history.length);
    } catch (error) {
      console.error('Failed to load notification history:', error);
    }
  };

  const handleSettingChange = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      const success = await updateNotificationSettings({ [key]: value });
      
      if (!success) {
        // Revert on failure
        setSettings(settings);
        Alert.alert('Error', 'Failed to update notification settings');
      } else {
        // Show confirmation for critical settings
        if (key === 'enabled' && !value) {
          Alert.alert(
            'Notifications Disabled',
            'You will not receive any emergency alerts or safety notifications. You can re-enable them anytime.',
            [{ text: 'OK' }]
          );
        } else if (key === 'panicAlerts' && !value) {
          Alert.alert(
            'Panic Alerts Disabled',
            'You will not receive emergency panic alert confirmations. This may affect your safety awareness.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleTestNotification = async () => {
    try {
      const success = await sendLocalNotification({
        type: 'safety_alert',
        title: '🧪 Test Notification',
        body: 'This is a test notification to verify your settings are working correctly.',
        data: { test: true },
        priority: 'normal',
      });

      if (success) {
        Alert.alert('Success', 'Test notification sent! Check your notification panel.');
      } else {
        Alert.alert('Failed', 'Could not send test notification. Check your settings.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleClearNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'This will clear all notifications from your device. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllNotifications();
              setNotificationCount(0);
              Alert.alert('Success', 'All notifications cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear notifications');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Master switch for all notifications
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => handleSettingChange('enabled', value)}
              trackColor={{ false: '#6b7280', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Sound</Text>
              <Text style={styles.settingDescription}>
                Play sound for notifications
              </Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => handleSettingChange('soundEnabled', value)}
              disabled={!settings.enabled}
              trackColor={{ false: '#6b7280', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Vibration</Text>
              <Text style={styles.settingDescription}>
                Vibrate device for notifications
              </Text>
            </View>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(value) => handleSettingChange('vibrationEnabled', value)}
              disabled={!settings.enabled}
              trackColor={{ false: '#6b7280', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleRow}>
                <Ionicons name="warning" size={20} color="#dc2626" />
                <Text style={styles.settingTitle}>Panic Alerts</Text>
              </View>
              <Text style={styles.settingDescription}>
                Emergency panic button confirmations and alerts
              </Text>
            </View>
            <Switch
              value={settings.panicAlerts}
              onValueChange={(value) => handleSettingChange('panicAlerts', value)}
              disabled={!settings.enabled}
              trackColor={{ false: '#6b7280', true: '#dc2626' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleRow}>
                <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                <Text style={styles.settingTitle}>Incident Notifications</Text>
              </View>
              <Text style={styles.settingDescription}>
                Alerts about nearby safety incidents
              </Text>
            </View>
            <Switch
              value={settings.incidentNotifications}
              onValueChange={(value) => handleSettingChange('incidentNotifications', value)}
              disabled={!settings.enabled}
              trackColor={{ false: '#6b7280', true: '#f59e0b' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleRow}>
                <Ionicons name="location" size={20} color="#3b82f6" />
                <Text style={styles.settingTitle}>Location Sharing</Text>
              </View>
              <Text style={styles.settingDescription}>
                Confirmations when sharing location with contacts
              </Text>
            </View>
            <Switch
              value={settings.locationSharing}
              onValueChange={(value) => handleSettingChange('locationSharing', value)}
              disabled={!settings.enabled}
              trackColor={{ false: '#6b7280', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleRow}>
                <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
                <Text style={styles.settingTitle}>Safety Alerts</Text>
              </View>
              <Text style={styles.settingDescription}>
                Safe zone entries/exits and general safety updates
              </Text>
            </View>
            <Switch
              value={settings.safetyAlerts}
              onValueChange={(value) => handleSettingChange('safetyAlerts', value)}
              disabled={!settings.enabled}
              trackColor={{ false: '#6b7280', true: '#22c55e' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleTestNotification}>
            <Ionicons name="flask" size={20} color="#3b82f6" />
            <Text style={styles.actionButtonText}>Test Notification</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleClearNotifications}>
            <Ionicons name="trash" size={20} color="#ef4444" />
            <Text style={styles.actionButtonText}>Clear All Notifications</Text>
            <View style={styles.actionButtonBadge}>
              <Text style={styles.actionButtonBadgeText}>{notificationCount}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#3b82f6" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>About Notifications</Text>
              <Text style={styles.infoDescription}>
                Notifications help keep you informed about safety alerts, emergency responses, 
                and location sharing activities. Emergency notifications are designed to work 
                even when your phone is in silent mode.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d1117',
  },
  loadingText: {
    color: '#6b7280',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1e2a33',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.3)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e2a33',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.3)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e2a33',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.3)',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 12,
  },
  actionButtonBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  actionButtonBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#1e2a33',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.3)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});