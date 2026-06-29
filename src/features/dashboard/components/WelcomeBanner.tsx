import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { colors } from '../../../shared/theme';

interface WelcomeBannerProps {
  name: string;
}

export default function WelcomeBanner({ name }: WelcomeBannerProps) {
  return (
    <View style={styles.banner}>
      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.tagline}>Ready to hit the road?</Text>
        </View>
        <View style={styles.mascotCircle}>
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
      <View style={styles.accentLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1,
  },
  tagline: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  mascotCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    backgroundColor: colors.primaryPale,
  },
  mascotVideo: {
    width: 90,
    height: 90,
  },
  accentLine: {
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
    marginTop: 16,
    width: 48,
  },
});
