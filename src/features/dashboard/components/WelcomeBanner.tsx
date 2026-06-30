import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { colors } from '../../../shared/theme';

interface WelcomeBannerProps {
  name: string;
}

export default function WelcomeBanner({ name }: WelcomeBannerProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerZone}>
        <Text style={styles.driverId}>DRIVER ID: {name.toUpperCase().slice(0, 2)}-9921</Text>
      </View>
      <View style={styles.tearLine}>
        <View style={styles.notchLeft} />
        <View style={styles.dash} />
        <View style={styles.notchRight} />
      </View>
      <View style={styles.body}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.name}>{name}</Text>
        </View>
        <View style={styles.routeSketch}>
          <Video
            source={require('../../../../assets/buzz-wave.webm')}
            style={styles.mascotVideo}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
            isMuted
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  headerZone: {
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  driverId: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  tearLine: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 1,
  },
  notchLeft: {
    width: 16,
    height: 32,
    backgroundColor: colors.kraft,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 0,
    borderRadius: 0,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    marginLeft: -9,
  },
  dash: {
    flex: 1,
    height: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  notchRight: {
    width: 16,
    height: 32,
    backgroundColor: colors.kraft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRightWidth: 0,
    borderRadius: 0,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    marginRight: -9,
  },
  body: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontFamily: 'IBMPlexSans_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  name: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
  },
  routeSketch: {
    width: 80,
    height: 80,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.primaryTint,
  },
  mascotVideo: {
    width: 80,
    height: 80,
  },
});
