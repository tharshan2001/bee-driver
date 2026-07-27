import { NativeModules, Platform } from 'react-native';

const { BackgroundLocation } = NativeModules;

export interface BackgroundLocationModule {
  start(): Promise<boolean>;
  stop(): Promise<boolean>;
  isActive(): Promise<boolean>;
}

const NativeBackgroundLocation: BackgroundLocationModule = {
  start: () => BackgroundLocation?.start() ?? Promise.reject(new Error('Native module not available')),
  stop: () => BackgroundLocation?.stop() ?? Promise.reject(new Error('Native module not available')),
  isActive: () => BackgroundLocation?.isActive() ?? Promise.resolve(false),
};

export const startNativeBackgroundLocation = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  try {
    return await NativeBackgroundLocation.start();
  } catch (e) {
    if (__DEV__) console.warn('[NativeBGLocation] start failed:', e);
    return false;
  }
};

export const stopNativeBackgroundLocation = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  try {
    return await NativeBackgroundLocation.stop();
  } catch (e) {
    if (__DEV__) console.warn('[NativeBGLocation] stop failed:', e);
    return false;
  }
};

export const isNativeBackgroundLocationActive = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  try {
    return await NativeBackgroundLocation.isActive();
  } catch (e) {
    return false;
  }
};
