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
    backgroundColor: colors.elevated,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.primaryTint,
  },
  mascotVideo: {
    width: 80,
    height: 80,
  },
});
