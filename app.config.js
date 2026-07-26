const fs = require('fs');
const path = require('path');

function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) return;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      env[key] = value;
    });
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || env.EXPO_PUBLIC_API_URL || 'http://localhost:8085/api';
const wsUrl = process.env.EXPO_PUBLIC_WS_URL || env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8085/ws/websocket';

/** @type {import('@expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 'eBee Go',
    slug: 'ebee-go',
    version: '1.0.0',
    icon: './assets/ebeeGO.png',
    favicon: './assets/favicon.png',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      backgroundColor: '#EDE6D3',
      resizeMode: 'contain',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.bee.driver',
      infoPlist: {
        UIBackgroundModes: ['location', 'remote-notification'],
        NSLocationWhenInUseUsageDescription:
          'eBee Go needs your location to navigate to delivery addresses and track your trips.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'eBee Go needs background location access to continuously share your live location with dispatchers and customers even when the app is closed.',
      },
    },
    android: {
      googleServicesFile: './google-services.json',
      package: 'com.ebee.driver',
      adaptiveIcon: {
        foregroundImage: './assets/ebeeGO.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      notification: {
        icon: './assets/android-icon-monochrome.png',
        color: '#FFC107',
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'FOREGROUND_SERVICE',
        'FOREGROUND_SERVICE_LOCATION',
        'POST_NOTIFICATIONS',
        'WAKE_LOCK',
        'REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      ],
    },
    newArchEnabled: true,
    plugins: [
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'eBee Go needs background location access to continuously share your live location with dispatchers and customers even when the app is closed.',
          locationWhenInUsePermission:
            'eBee Go needs your location to navigate to delivery addresses and track your trips.',
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: '35.0.0',
            minSdkVersion: 26,
            kotlinVersion: '2.0.21',
          },
        },
      ],
      'expo-task-manager',
      'expo-font',
      'expo-video',
      'expo-notifications',
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
    ],
    projectId: '9c17f6ca-6688-4c93-9847-16d86554ed6b',
    extra: {
      apiBaseUrl,
      wsUrl,
      eas: {
        projectId: '9c17f6ca-6688-4c93-9847-16d86554ed6b',
      },
    },
  },
};
