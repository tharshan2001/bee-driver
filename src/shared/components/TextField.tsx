import React, { useState } from 'react';
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Touchable from './Touchable';
import { colors } from '../theme';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  /** Hidden text with an eye inside the field to reveal it. */
  password?: boolean;
  onRevealChange?: (revealed: boolean) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

/** A labelled, filled input box. */
export default function TextField({ label, error, password, onRevealChange, containerStyle, multiline, ...input }: Props) {
  const [revealed, setRevealed] = useState(false);

  function toggle() {
    setRevealed(!revealed);
    onRevealChange?.(!revealed);
  }

  return (
    <View style={containerStyle}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, multiline && styles.tall, !!error && styles.boxError]}>
        <TextInput
          {...input}
          multiline={multiline}
          style={[styles.input, multiline && { textAlignVertical: 'top' }]}
          secureTextEntry={password && !revealed}
          autoCapitalize={password ? 'none' : input.autoCapitalize}
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel={label}
        />
        {password && (
          <Touchable style={styles.eye} onPress={toggle} accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}>
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
          </Touchable>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export const fieldLabel = {
  fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary,
  textTransform: 'uppercase' as const, marginTop: 14, marginBottom: 6,
};

const styles = StyleSheet.create({
  label: fieldLabel,
  box: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderRadius: 10, backgroundColor: colors.surface },
  tall: { minHeight: 88, alignItems: 'stretch' },
  boxError: { borderWidth: 1, borderColor: colors.danger },
  input: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    fontFamily: 'IBMPlexSans_400Regular', color: colors.textPrimary,
  },
  eye: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  error: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 12, color: colors.danger, marginTop: 4 },
});
