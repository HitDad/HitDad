import { StyleSheet, Text, View } from 'react-native';

import { BorderWidth, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AuthAlertVariant = 'error' | 'warning' | 'success' | 'info';

export interface AuthAlertProps {
  variant?: AuthAlertVariant;
  title: string;
  message?: string;
}

/**
 * Feedback banner replicating Figma `00a-err` Validation Error Alert (`#2016:2393`).
 */
export function AuthAlert({ variant = 'error', title, message }: AuthAlertProps) {
  const colors = useTheme();

  const palette = {
    error: {
      backgroundColor: colors.dangerBackground,
      borderColor: colors.dangerBorder,
      titleColor: colors.dangerText,
      bodyColor: colors.danger,
    },
    warning: {
      backgroundColor: colors.warningBackground,
      borderColor: colors.warning,
      titleColor: colors.warning,
      bodyColor: colors.text,
    },
    success: {
      backgroundColor: colors.successBackground,
      borderColor: colors.success,
      titleColor: colors.success,
      bodyColor: colors.text,
    },
    info: {
      backgroundColor: colors.primarySurface,
      borderColor: colors.primaryLight,
      titleColor: colors.primary,
      bodyColor: colors.text,
    },
  }[variant];

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.container,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
      ]}>
      <Text style={[Typography.metaStrong13, { color: palette.titleColor }]}>{title}</Text>
      {message ? (
        <Text style={[Typography.small12, { color: palette.bodyColor }]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: BorderWidth.hairline,
    gap: Spacing.xs,
  },
});
