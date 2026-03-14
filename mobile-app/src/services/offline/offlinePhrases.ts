import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_EMERGENCY_PHRASES_KEY = 'offline_emergency_phrases_v1';

const DEFAULT_EMERGENCY_PHRASES = [
  'SOS',
  'Need Help',
  'Medical Emergency',
  'Call Police',
];

export async function seedEmergencyPhrases() {
  const existing = await AsyncStorage.getItem(OFFLINE_EMERGENCY_PHRASES_KEY);
  if (!existing) {
    await AsyncStorage.setItem(
      OFFLINE_EMERGENCY_PHRASES_KEY,
      JSON.stringify(DEFAULT_EMERGENCY_PHRASES)
    );
  }
}

export async function getEmergencyPhrases(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(OFFLINE_EMERGENCY_PHRASES_KEY);
  return raw ? (JSON.parse(raw) as string[]) : DEFAULT_EMERGENCY_PHRASES;
}

export async function setEmergencyPhrases(phrases: string[]) {
  await AsyncStorage.setItem(OFFLINE_EMERGENCY_PHRASES_KEY, JSON.stringify(phrases));
}
