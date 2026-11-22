import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthAlert, AuthButton, AuthInput, AuthScreenShell } from '@/components/auth';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { ApiClientError } from '@/services/api';
import { authService } from '@/services/auth';

export default function ForgotPasswordScreen() {
  const { setPendingPasswordReset } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = emailOrUsername.trim();
    if (!trimmed) {
      setInputError('Vui lòng nhập tên đăng nhập hoặc email');
      return;
    }

    setInputError(null);
    setServerError(null);
    setIsSubmitting(true);

    try {
      const response = await authService.sendForgotPasswordOtp({ emailOrUsername: trimmed });
      setPendingPasswordReset({
        email: response.email,
        maskedEmail: response.maskedEmail,
      });
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { mode: 'forgot-password' },
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setServerError(error.message);
      } else {
        setServerError('Không thể gửi yêu cầu khôi phục mật khẩu. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      header={{
        variant: 'back',
        backLabel: 'Trở về Đăng nhập',
        onBack: () => router.back(),
        title: 'QUÊN MẬT KHẨU',
        subtitle: 'Nhập tên đăng nhập hoặc email để nhận mã khôi phục',
      }}
      footer={
        <AuthButton
          label="GỬI MÃ KHÔI PHỤC"
          onPress={handleSubmit}
          loading={isSubmitting}
        />
      }>
      {serverError ? (
        <AuthAlert title="Không thể gửi mã OTP" message={serverError} />
      ) : null}

      <View style={styles.fields}>
        <AuthInput
          label="Tên đăng nhập hoặc Email"
          placeholder="nguyenvana hoặc email@..."
          helperText="Hệ thống sẽ gửi mã OTP 6 chữ số đến email đã đăng ký"
          value={emailOrUsername}
          onChangeText={(text) => {
            setEmailOrUsername(text);
            if (inputError) setInputError(null);
            if (serverError) setServerError(null);
          }}
          error={inputError}
          autoCapitalize="none"
          autoCorrect={false}
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
});
