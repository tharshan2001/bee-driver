import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { colors } from '../../../shared/theme';

interface WelcomeBannerProps {
  name: string;
}

export default function WelcomeBanner({ name }: WelcomeBannerProps) {
  const player = useVideoPlayer(require('../../../../assets/buzz-wave.mp4'), (player) => {
    player.loop = true;
    player.muted = true;
  });

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#FFF7E0', '#FFF3CD', '#FFE082']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.05)']}
          start={{ x: -0.3, y: -0.3 }}
          end={{ x: 0.7, y: 0.7 }}
          style={styles.shine}
        />
        <View style={styles.body}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.name}>{name}</Text>
          </View>
          <View style={styles.routeSketch}>
            <VideoView
              style={styles.mascotVideo}
              player={player}
              contentFit="contain"
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  gradient: {
    borderRadius: 10,
    position: 'relative',
  },
  shine: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
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
    color: 'rgba(0,0,0,0.55)',
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
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  mascotVideo: {
    width: 80,
    height: 80,
  },
});
