import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControlProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  padding?: number;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export default function ScreenContainer({ children, scroll = false, padding, refreshControl }: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const content = (
    <View style={[styles.inner, padding != null ? { padding } : { paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }]}>
      {children}
    </View>
  );
  return (
    <View style={[styles.outer, { paddingTop: insets.top }]}>
      {scroll ? (
        <ScrollView style={styles.outer} refreshControl={refreshControl}>
          {content}
        </ScrollView>
      ) : content}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.background },
  inner: { flexGrow: 1 },
});
