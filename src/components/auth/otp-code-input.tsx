import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputInstance, View } from 'react-native';

import { BorderWidth, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface OtpCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  hasError?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (code: string) => void;
}

/**
 * 6-digit HitDad OTP box input backed by a single transparent TextInput
 * for seamless mobile paste, autofill (`oneTimeCode`), and backspace handling.
 */
export function OtpCodeInput({
  value,
  onChange,
  length = 6,
  hasError = false,
  disabled = false,
  autoFocus = true,
  onComplete,
}: OtpCodeInputProps) {
  const colors = useTheme();
  const inputRef = useRef<TextInputInstance>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleChangeText = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, length);
    onChange(cleaned);
    if (cleaned.length === length && cleaned !== value) {
      onComplete?.(cleaned);
    }
  };

  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      disabled={disabled}
      style={styles.wrapper}
      accessibilityLabel={`Nhập mã OTP ${length} chữ số`}>
      <View style={styles.boxesRow} pointerEvents="none">
        {Array.from({ length }, (_, index) => {
          const digit = value[index] ?? '';
          const isActive = isFocused && index === activeIndex;
          const isFilled = Boolean(digit);

          const borderColor = hasError
            ? colors.danger
            : isActive
              ? colors.primary
              : isFilled
                ? colors.borderActive
                : colors.border;

          const backgroundColor = hasError
            ? colors.dangerBackground
            : isActive || isFilled
              ? colors.backgroundSelected
              : colors.surface;

          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  borderColor,
                  backgroundColor,
                  borderWidth: isActive ? BorderWidth.active : BorderWidth.default,
                },
              ]}>
              <Text style={[Typography.date26, { color: colors.text }]}>{digit}</Text>
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        editable={!disabled}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        caretHidden
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  boxesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  box: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0.02,
    color: 'transparent',
  },
});
