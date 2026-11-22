import { Ionicons } from '@expo/vector-icons';
import { type Ref, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputInstance,
  type TextInputProps,
  View,
} from 'react-native';

import { BorderWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface AuthInputProps extends Omit<TextInputProps, 'style'> {
  ref?: Ref<TextInputInstance>;
  label: string;
  rightActionLabel?: string;
  onRightActionPress?: () => void;
  error?: string | null;
  hasError?: boolean;
  helperText?: string;
}

/**
 * Form input matching Figma `HD/Input` (`44px` height, `10px` radius, `1.5px` stroke)
 * with focus/error border states and password visibility toggle.
 */
export function AuthInput({
  ref,
  label,
  rightActionLabel,
  onRightActionPress,
  error,
  hasError: hasErrorProp = false,
  helperText,
  secureTextEntry,
  onFocus,
  onBlur,
  ...inputProps
}: AuthInputProps) {
  const colors = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasError = Boolean(error) || hasErrorProp;
  const borderColor = hasError
    ? colors.danger
    : isFocused
      ? colors.borderActive
      : colors.border;

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={[Typography.metaStrong13, { color: colors.text }]}>{label}</Text>
        {rightActionLabel && onRightActionPress ? (
          <Pressable
            onPress={onRightActionPress}
            hitSlop={8}
            accessibilityRole="button"
            style={({ pressed }) => pressed && styles.pressed}>
            <Text style={[Typography.metaStrong13, { color: colors.primary }]}>
              {rightActionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View
        style={[
          styles.inputBox,
          {
            backgroundColor: colors.surface,
            borderColor,
          },
        ]}>
        <TextInput
          ref={ref}
          {...inputProps}
          secureTextEntry={Boolean(secureTextEntry && !isPasswordVisible)}
          placeholderTextColor={colors.textSecondary}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, Typography.body14, { color: colors.text }]}
        />

        {secureTextEntry ? (
          <Pressable
            onPress={() => setIsPasswordVisible((prev) => !prev)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            style={({ pressed }) => pressed && styles.pressed}>
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={[Typography.small12, { color: colors.danger }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[Typography.headerSub11, { color: colors.textSecondary }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inputBox: {
    height: 44,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.default,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  pressed: {
    opacity: 0.7,
  },
});
