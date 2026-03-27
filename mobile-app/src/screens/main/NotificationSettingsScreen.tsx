import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import {
  NotificationSettings,
  getNotificationSettings,
  updateNotificationSettings,
  clearAllNotifications,
  getNotificationHistory,
  sendLocalNotification,
} from '../../services/notificationService';

const C = {
  bg: '#F8FAF5',
  card: '#FFFFFF',
  green: '#2D6A4F',
  greenPale: '#D8F3DC',
  accent: '#40916C',
  text: '#1B1B1B',
  textSecondary: '#6B7280',
  border: '#1B1B1B',
  red: '#DC2626',
  redPale: '#FECACA',
  yellow: '#F59E0B',
  yellowPale: '#FEF3C7',
  blue: '#2563EB',
  bluePale: '#DBEAFE',
};

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

export default function NotificationSettingsScreen({ navigation }: Props) {
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();

    loadSettings();
    loadNotificationHistory();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await getNotificationSettings();
      setSettings(currentSettings);
    } catch {
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationHistory = async () => {
    try {
      const history = await getNotificationHistory();
      setNotificationCount(history.length);
    } catch {
      setNotificationCount(0);
    }
  };

  const handleSettingChange = async (key: keyof NotificationSettings, value: boolean) => {
    const previous = settings;
    const next = { ...settings, [key]: value };
    setSettings(next);

    try {
      const success = await updateNotificationSettings({ [key]: value });
      if (!success) {
        setSettings(previous);
        Alert.alert('Error', 'Failed to update notification settings');
        return;
      }

      if (key === 'enabled' && !value) {
        Alert.alert('Notifications Disabled', 'You will not receive emergency alerts until re-enabled.');
      }
    } catch {
      setSettings(previous);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleTestNotification = async () => {
    try {
      const success = await sendLocalNotification({
        type: 'safety_alert',
        title: 'Test Notification',
        body: 'Notification settings are working correctly.',
        data: { test: true },
        priority: 'normal',
      });

      Alert.alert(success ? 'Success' : 'Failed', success ? 'Test notification sent.' : 'Could not send test notification.');
    } catch {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleClearNotifications = () => {
    Alert.alert('Clear All Notifications', 'This will clear all notifications from your device. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearAllNotifications();
            setNotificationCount(0);
            Alert.alert('Success', 'All notifications cleared');
          } catch {
            Alert.alert('Error', 'Failed to clear notifications');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaWrapper backgroundColor={C.bg} statusBarStyle="dark-content">
        <View style={s.loadingWrap}>
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color={C.green} />
            <Text style={s.loadingText}>Loading settings...</Text>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={C.bg} statusBarStyle="dark-content">
      <Animated.View style={[s.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
              <Ionicons name="arrow-back" size={22} color={C.text} />
            </TouchableOpacity>
            <View>
              <Text style={s.headerTitle}>Notification Settings</Text>
              <Text style={s.headerSub}>Manage alerts and behavior</Text>
            </View>
          </View>
          <View style={s.headChip}>
            <Ionicons name="notifications" size={16} color={C.accent} />
          </View>
        </View>

        <ScrollView style={s.content} showsVerticalScrollIndicator={false} contentContainerStyle={s.contentPad}>
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>General</Text>
            <SettingRow
              title="Enable Notifications"
              description="Master switch for all notifications"
              icon="notifications"
              iconBg={C.bluePale}
              iconColor={C.blue}
              value={settings.enabled}
              onChange={(v) => handleSettingChange('enabled', v)}
            />
            <SettingRow
              title="Sound"
              description="Play sound for alerts"
              icon="volume-high"
              iconBg={C.yellowPale}
              iconColor={C.yellow}
              value={settings.soundEnabled}
              onChange={(v) => handleSettingChange('soundEnabled', v)}
              disabled={!settings.enabled}
            />
            <SettingRow
              title="Vibration"
              description="Vibrate for notifications"
              icon="phone-portrait"
              iconBg={C.greenPale}
              iconColor={C.green}
              value={settings.vibrationEnabled}
              onChange={(v) => handleSettingChange('vibrationEnabled', v)}
              disabled={!settings.enabled}
            />
          </View>

          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Alert Types</Text>
            <SettingRow
              title="Panic Alerts"
              description="Emergency panic confirmations"
              icon="warning"
              iconBg={C.redPale}
              iconColor={C.red}
              value={settings.panicAlerts}
              onChange={(v) => handleSettingChange('panicAlerts', v)}
              disabled={!settings.enabled}
            />
            <SettingRow
              title="Incident Notifications"
              description="Nearby safety incidents"
              icon="alert-circle"
              iconBg={C.yellowPale}
              iconColor={C.yellow}
              value={settings.incidentNotifications}
              onChange={(v) => handleSettingChange('incidentNotifications', v)}
              disabled={!settings.enabled}
            />
            <SettingRow
              title="Location Sharing"
              description="Share-location confirmations"
              icon="location"
              iconBg={C.bluePale}
              iconColor={C.blue}
              value={settings.locationSharing}
              onChange={(v) => handleSettingChange('locationSharing', v)}
              disabled={!settings.enabled}
            />
            <SettingRow
              title="Safety Alerts"
              description="Safe zone and safety updates"
              icon="shield-checkmark"
              iconBg={C.greenPale}
              iconColor={C.green}
              value={settings.safetyAlerts}
              onChange={(v) => handleSettingChange('safetyAlerts', v)}
              disabled={!settings.enabled}
            />
          </View>

          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Actions</Text>
            <TouchableOpacity style={s.actionBtn} onPress={handleTestNotification} activeOpacity={0.8}>
              <View style={[s.actionIcon, { backgroundColor: C.bluePale }]}>
                <Ionicons name="flask" size={16} color={C.blue} />
              </View>
              <Text style={s.actionText}>Test Notification</Text>
              <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={s.actionBtn} onPress={handleClearNotifications} activeOpacity={0.8}>
              <View style={[s.actionIcon, { backgroundColor: C.redPale }]}>
                <Ionicons name="trash" size={16} color={C.red} />
              </View>
              <Text style={s.actionText}>Clear All Notifications</Text>
              <View style={s.badge}><Text style={s.badgeText}>{notificationCount}</Text></View>
            </TouchableOpacity>
          </View>

          <View style={s.infoCard}>
            <Ionicons name="information-circle" size={20} color={C.accent} />
            <Text style={s.infoText}>
              Emergency notifications are critical for safety updates and panic responses. Keep alerts enabled for best protection.
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaWrapper>
  );
}

type SettingRowProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
};

function SettingRow({ title, description, icon, iconBg, iconColor, value, onChange, disabled }: SettingRowProps) {
  return (
    <View style={[s.settingRow, disabled && { opacity: 0.55 }]}>
      <View style={[s.settingIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <View style={s.settingTextWrap}>
        <Text style={s.settingTitle}>{title}</Text>
        <Text style={s.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: '#D1D5DB', true: '#B7E4C7' }}
        thumbColor={value ? '#2D6A4F' : '#FFFFFF'}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  loadingCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 28,
    borderWidth: 2.5,
    borderColor: C.border,
    shadowColor: C.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
    alignItems: 'center',
  },
  loadingText: {
    color: C.textSecondary,
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  headerTitle: { color: C.text, fontSize: 21, fontWeight: '800' },
  headerSub: { color: C.textSecondary, fontSize: 12, marginTop: 1 },
  headChip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.greenPale,
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

  content: { flex: 1 },
  contentPad: { paddingHorizontal: 16, paddingBottom: 26 },

  sectionCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2.5,
    borderColor: C.border,
    shadowColor: C.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  settingIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
  },
  settingTextWrap: { flex: 1, marginLeft: 10, marginRight: 10 },
  settingTitle: { color: C.text, fontSize: 14, fontWeight: '700' },
  settingDesc: { color: C.textSecondary, fontSize: 12, marginTop: 1 },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    marginRight: 10,
  },
  actionText: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    fontWeight: '700',
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.redPale,
    borderWidth: 1.5,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: C.red, fontSize: 12, fontWeight: '800' },

  infoCard: {
    backgroundColor: C.bluePale,
    borderRadius: 14,
    padding: 12,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 2.5,
    borderColor: C.border,
    shadowColor: C.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: C.text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
});
