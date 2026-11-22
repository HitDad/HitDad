import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, type TextInputInstance, View } from 'react-native';

import {
  AuthAlert,
  type AuthAlertVariant,
  AuthButton,
  AuthInput,
  AuthScreenShell,
} from '@/components/auth';
import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { ApiClientError } from '@/services/api';

interface AlertState {
  variant: AuthAlertVariant;
  title: string;
  message: string;
}

export default function LoginScreen() {
  const colors = useTheme();
  const { signIn } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverAlert, setServerAlert] = useState<AlertState | null>(null);
  const [highlightPasswordError, setHighlightPasswordError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedIdentifier = identifier.trim();
    let valid = true;

    if (!trimmedIdentifier) {
      setIdentifierError('Vui lòng nhập tên đăng nhập hoặc email');
      valid = false;
    } else {
      setIdentifierError(null);
    }

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu');
      valid = false;
    } else {
      setPasswordError(null);
    }

    if (!valid) return;

    setServerAlert(null);
    setHighlightPasswordError(false);
    setIsSubmitting(true);

    try {
      await signIn({ username: trimmedIdentifier, password });
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.code === 'MEMBERSHIP_PENDING') {
          setServerAlert({
            variant: 'warning',
            title: 'Tài khoản đang chờ duyệt',
            message: error.message,
          });
        } else if (error.code === 'MEMBERSHIP_REJECTED') {
          setServerAlert({
            variant: 'error',
            title: 'Đơn gia nhập bị từ chối',
            message: error.message,
          });
        } else {
          setHighlightPasswordError(true);
          setServerAlert({
            variant: 'error',
            title: 'Đăng nhập không thành công',
            message: error.message,
          });
        }
      } else {
        setServerAlert({
          variant: 'error',
          title: 'Không thể kết nối máy chủ',
          message: 'Vui lòng kiểm tra mạng và thử lại.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      header={{
        variant: 'brand',
        title: 'ĐĂNG NHẬP',
        subtitle: 'Chào mừng trở lại với HitDad',
      }}
      footer={
        <>
          <AuthButton
            label="ĐĂNG NHẬP"
            onPress={handleSubmit}
            loading={isSubmitting}
          />
          <View style={styles.linkRow}>
            <Text style={[Typography.meta13, { color: colors.textSecondary }]}>
              Chưa có tài khoản?
            </Text>
            <Pressable
              onPress={() => router.push('/(auth)/register')}
              hitSlop={8}
              accessibilityRole="button"
              style={({ pressed }) => pressed && styles.pressed}>
              <Text style={[Typography.metaStrong13, { color: colors.primary }]}>
                Đăng ký ngay
              </Text>
            </Pressable>
          </View>
        </>
      }>
      {serverAlert ? (
        <AuthAlert
          variant={serverAlert.variant}
          title={serverAlert.title}
          message={serverAlert.message}
        />
      ) : null}

      <View style={styles.fields}>
        <AuthInput
          label="Tên đăng nhập hoặc Email"
          placeholder="nguyenvana hoặc email@..."
          value={identifier}
          onChangeText={(text) => {
            setIdentifier(text);
            if (identifierError) setIdentifierError(null);
            if (serverAlert) setServerAlert(null);
          }}
          error={identifierError}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <AuthInput
          ref={passwordRef}
          label="Mật khẩu"
          rightActionLabel="Quên mật khẩu?"
          onRightActionPress={() => router.push('/(auth)/forgot-password')}
          placeholder="••••••••"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError(null);
            if (highlightPasswordError) setHighlightPasswordError(false);
            if (serverAlert) setServerAlert(null);
          }}
          error={passwordError}
          hasError={highlightPasswordError}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: Spacing.screen,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
