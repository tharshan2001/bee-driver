import { NativeModules, Platform } from 'react-native';

const { NativeLocation } = NativeModules;

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
  bearing?: number;
  speed?: number;
  altitude?: number;
  timestamp: number;
}

export interface NativeLocationModule {
  start(authToken: string): Promise<boolean>;
  stop(): Promise<boolean>;
  isActive(): Promise<boolean>;
  getLastLocation(): Promise<LocationResult | null>;
  setDriverId(driverId: string): Promise<boolean>;
}

const Impl: NativeLocationModule = {
  start: (authToken: string) =>
    NativeLocation?.start(authToken) ?? Promise.reject(new Error('Native module not available')),
  stop: () =>
    NativeLocation?.stop() ?? Promise.reject(new Error('Native module not available')),
  isActive: () =>
    NativeLocation?.isActive() ?? Promise.resolve(false),
  getLastLocation: () =>
    (NativeLocation?.getLastLocation() ?? Promise.resolve(null)) as Promise<LocationResult | null>,
  setDriverId: (id: string) =>
    NativeLocation?.setDriverId(id) ?? Promise.reject(new Error('Native module not available')),
};

export const startNativeLocation = async (authToken: string): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  try {
    return await Impl.start(authToken);
  } catch (e) {
    if (__DEV__) console.warn('[NativeLocation] start failed:', e);
    throw e;
  }
};

export const stopNativeLocation = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  try {
    return await Impl.stop();
  } catch (e) {
    if (__DEV__) console.warn('[NativeLocation] stop failed:', e);
    return false;
  }
};

export const isNativeLocationActive = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  try {
    return await Impl.isActive();
  } catch (e) {
    return false;
  }
};

export const getLastNativeLocation = async (): Promise<LocationResult | null> => {
  if (Platform.OS !== 'android') return null;
  try {
    return await Impl.getLastLocation();
  } catch (e) {
    return null;
  }
};

export const setNativeDriverId = async (driverId: string): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  try {
    return await Impl.setDriverId(driverId);
  } catch (e) {
    if (__DEV__) console.warn('[NativeLocation] setDriverId failed:', e);
    return false;
  }
};
