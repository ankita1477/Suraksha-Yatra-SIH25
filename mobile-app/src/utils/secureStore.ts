import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isNative = Platform.OS !== 'web';

export async function getItem(key: string): Promise<string | null> {
  try {
    if (isNative) return await SecureStore.getItemAsync(key);
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
    return null;
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    if (isNative) await SecureStore.setItemAsync(key, value);
    else if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  } catch {}
}

export async function deleteItem(key: string): Promise<void> {
  try {
    if (isNative) await SecureStore.deleteItemAsync(key);
    else if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  } catch {}
}
