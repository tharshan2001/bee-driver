import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const DRIVER_ID_KEY = 'driver_id';
const AVAILABILITY_KEY = 'availability';

function isSecureStoreAvailable(): boolean {
  return Platform.OS !== 'web';
}

async function secureGet(key: string): Promise<string | null> {
  if (isSecureStoreAvailable()) {
    try { return await SecureStore.getItemAsync(key); } catch {}
  }
  return AsyncStorage.getItem(key);
}

async function secureSet(key: string, value: string) {
  if (isSecureStoreAvailable()) {
    try { await SecureStore.setItemAsync(key, value); return; } catch {}
  }
  await AsyncStorage.setItem(key, value);
}

async function secureDelete(key: string) {
  if (isSecureStoreAvailable()) {
    try { await SecureStore.deleteItemAsync(key); return; } catch {}
  }
  await AsyncStorage.removeItem(key);
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    secureSet(ACCESS_TOKEN_KEY, accessToken),
    secureSet(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function getTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      secureGet(ACCESS_TOKEN_KEY),
      secureGet(REFRESH_TOKEN_KEY),
    ]);
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearTokens() {
  await Promise.all([
    secureDelete(ACCESS_TOKEN_KEY),
    secureDelete(REFRESH_TOKEN_KEY),
    secureDelete(DRIVER_ID_KEY),
    secureDelete(AVAILABILITY_KEY),
  ]);
}

export async function saveDriverId(id: string) {
  await secureSet(DRIVER_ID_KEY, id);
}

export async function getDriverId(): Promise<string | null> {
  return secureGet(DRIVER_ID_KEY);
}

export async function saveAvailability(available: boolean) {
  await secureSet(AVAILABILITY_KEY, String(available));
}

export async function getAvailability(): Promise<boolean> {
  const val = await secureGet(AVAILABILITY_KEY);
  return val === 'true';
}

export async function cacheData(key: string, data: any) {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}
