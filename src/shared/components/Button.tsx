import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import Touchable from './Touchable';
import { colors } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** The yellow call to action. */
export default function Button({ title, onPress, loading, style }: Props) {
  return (
    <Touchable style={[styles.button, loading && styles.busy, style]} onPress={onPress} disabled={loading}
      accessibilityRole="button">
      {loading ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.text}>{title}</Text>}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48, borderRadius: 10, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, marginTop: 24,
  },
  busy: { opacity: 0.6 },
  text: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 15, letterSpacing: 0.5, color: colors.textOnPrimary },
});
