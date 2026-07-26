# Build Guide

## Prerequisites

- Java 17 (OpenJDK)
- Node.js v26+
- npm v12+

## Pre-build

```bash
npm doctor
npm install
```

## Update LAN IP

Update `.env` with your current LAN IP:

```bash
# Get your IP
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}'

# Edit .env and update EXPO_PUBLIC_API_URL and EXPO_PUBLIC_WS_URL
```

## Local Release Build (Android)

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

## Move to Downloads

```bash
mv android/app/build/outputs/apk/release/app-release.apk ~/Downloads/
```

## EAS Cloud Builds

```bash
# Production AAB (Google Play)
eas build --platform android --profile production

# Preview APK (internal testing)
eas build --platform android --profile preview

# Standalone APK
eas build --platform android --profile apk

# Development client
eas build --platform android --profile development
```

## Development

```bash
npm run android
```
