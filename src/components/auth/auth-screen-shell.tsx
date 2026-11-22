import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AuthHeader, type AuthHeaderProps } from './auth-header';

export interface AuthScreenShellProps {
  header: AuthHeaderProps;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared layout shell for all auth screens: blue hero header, `#F4F7FC` canvas,
 * keyboard-aware scrollable body, and bottom-pinned CTA footer.
 */
export function AuthScreenShell({ header, children, footer }: AuthScreenShellProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <StatusBar style="light" />
      <AuthHeader {...header} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.flex}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, Spacing.screen) + 10 },
          ]}>
          <View style={styles.bodyTop}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.screen,
    width: '100%',
    maxWidth: MaxContentWidth + Spacing.screen * 2,
    alignSelf: 'center',
    gap: Spacing.xl,
  },
  bodyTop: {
    gap: Spacing.screen,
  },
  footer: {
    gap: Spacing.lg,
  },
});
