import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Platform, Linking, TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { colors } from '../../../shared/theme';

const LOCATION_REFRESH_INTERVAL = 15_000;

export default function LiveLocationScreen() {
  const insets = useSafeAreaInsets();
  const { isTracking } = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gpsOff, setGpsOff] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const mountedRef = useRef(true);

  const fetchLocation = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        setError('Live location is only available on the mobile app');
        return;
      }
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setGpsOff(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      if (!mountedRef.current) return;
      setLocation(loc);
      setGpsOff(false);
      setError(null);

      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (!mountedRef.current) return;
      if (geocode.length > 0) {
        const a = geocode[0];
        const parts = [a.name, a.street, a.district, a.city, a.region, a.country].filter(Boolean);
        setAddress(parts.join(', '));
      }
    } catch (e: any) {
      if (!mountedRef.current) return;
      const msg = e?.message || 'Failed to get location';
      if (msg.toLowerCase().includes('location') && (msg.toLowerCase().includes('disabled') || msg.toLowerCase().includes('off') || msg.toLowerCase().includes('turned'))) {
        setGpsOff(true);
        setError('Location services are turned off. Please enable them in Settings.');
      } else {
        setGpsOff(false);
        setError(msg);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchLocation();

    const interval = setInterval(() => {
      if (mountedRef.current) fetchLocation();
    }, LOCATION_REFRESH_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [retryCount, fetchLocation]);

  const openSettings = () => {
    Linking.openSettings();
  };

  const openInMaps = () => {
    if (!location) return;
    const { latitude, longitude } = location.coords;
    const url = Platform.OS === 'web'
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      const webUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      Linking.openURL(webUrl);
    });
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <Ionicons name="globe-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.errorText}>Live location is only available on the mobile app</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.center}>
          <Ionicons name="location-outline" size={48} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorActions}>
            {gpsOff && (
              <TouchableOpacity onPress={openSettings} style={styles.settingsBtn}>
                <Text style={styles.settingsText}>OPEN SETTINGS</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setRetryCount((c) => c + 1)}
              style={styles.retryBtn}
            >
              <Text style={styles.retryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : !location ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      ) : (
        <>
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={64} color={colors.primary} />
            <Text style={styles.mapPlaceholderText}>Your location</Text>
          </View>

          <View style={[styles.card, { marginHorizontal: 16, marginTop: -32 }]}>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: isTracking ? colors.success : colors.danger }]} />
              <Text style={styles.statusLabel}>
                {isTracking ? 'Sharing location' : 'Not sharing'}
              </Text>
            </View>

            <View style={styles.coordRow}>
              <Ionicons name="navigate-outline" size={16} color={colors.textTertiary} />
              <Text style={styles.coordText}>
                {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
              </Text>
            </View>

            {address && (
              <View style={styles.addressRow}>
                <Ionicons name="home-outline" size={16} color={colors.textTertiary} />
                <Text style={styles.addressText}>{address}</Text>
              </View>
            )}

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                Accuracy: ±{Math.round(location.coords.accuracy ?? 0)}m
              </Text>
              <Text style={styles.metaText}>
                Altitude: {Math.round(location.coords.altitude ?? 0)}m
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={openInMaps} style={styles.actionButton}>
            <Ionicons name="compass-outline" size={20} color="#fff" />
            <Text style={styles.actionText}>OPEN IN GOOGLE MAPS</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12,
    padding: 32,
  },
  mapPlaceholder: {
    height: 240, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 16, borderRadius: 10,
  },
  mapPlaceholderText: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 11,
    color: colors.textTertiary, textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.surface, borderRadius: 10, padding: 16, gap: 12,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textPrimary,
  },
  coordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coordText: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 13, color: colors.textPrimary,
  },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  addressText: {
    fontFamily: 'IBMPlexSans_400Regular', fontSize: 13, color: colors.textSecondary,
    flex: 1,
  },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  metaText: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 10, color: colors.textTertiary,
  },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, marginHorizontal: 16, marginTop: 16,
    paddingVertical: 14, borderRadius: 10,
  },
  actionText: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: '#fff',
    textTransform: 'uppercase',
  },
  errorText: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 13, color: colors.danger,
    textAlign: 'center',
  },
  loadingText: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 13, color: colors.textTertiary,
  },
  retryBtn: {
    paddingVertical: 10, paddingHorizontal: 24, backgroundColor: colors.primary,
    borderRadius: 10, marginTop: 8,
  },
  retryText: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: '#fff',
    textTransform: 'uppercase',
  },
  errorActions: {
    flexDirection: 'row', gap: 12, marginTop: 8,
  },
  settingsBtn: {
    paddingVertical: 10, paddingHorizontal: 24, backgroundColor: colors.surface,
    borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: colors.primary,
  },
  settingsText: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.primary,
    textTransform: 'uppercase',
  },
});
