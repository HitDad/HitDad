import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthAlert, AuthButton, AuthInput, AuthScreenShell } from '@/components/auth';
import { BorderWidth, Elevation, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { ApiClientError } from '@/services/api';
import { authService } from '@/services/auth';

export default function ResetPasswordScreen() {
  const colors = useTheme();
  const { pendingPasswordReset, setPendingPasswordReset } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (successMessage) {
    return (
      <AuthScreenShell
        header={{
          variant: 'back',
          backLabel: 'Đăng nhập',
          onBack: () => router.replace('/(auth)/login'),
          title: 'ĐẶT LẠI MẬT KHẨU',
          subtitle: 'Mật khẩu mới đã sẵn sàng để sử dụng',
        }}
        footer={
          <AuthButton
            label="ĐĂNG NHẬP NGAY"
            onPress={() => router.replace('/(auth)/login')}
          />
        }>
        <View
          style={[
            styles.card,
            Elevation.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <View style={styles.successHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.successBackground }]}>
              <Ionicons name="checkmark-circle" size={28} color={colors.success} />
            </View>
            <View style={styles.successBody}>
              <Text style={[Typography.section15, { color: colors.text }]}>
                Đặt lại mật khẩu thành công!
              </Text>
              <Text style={[Typography.small12, { color: colors.textSecondary }]}>
                {successMessage}
              </Text>
            </View>
          </View>
        </View>
      </AuthScreenShell>
    );
  }

  const resetEmail = pendingPasswordReset?.email;
  const resetToken = pendingPasswordReset?.resetToken;
  const displayResetEmail = pendingPasswordReset?.maskedEmail || resetEmail || '';

  if (!resetEmail || !resetToken) {
    return (
      <AuthScreenShell
        header={{
          variant: 'back',
          backLabel: 'Quên mật khẩu',
          onBack: () => router.replace('/(auth)/forgot-password'),
          title: 'ĐẶT LẠI MẬT KHẨU',
          subtitle: 'Tạo mật khẩu mới cho tài khoản của bạn',
        }}
        footer={
          <AuthButton
            label="YÊU CẦU MÃ OTP MỚI"
            onPress={() => router.replace('/(auth)/forgot-password')}
          />
        }>
        <AuthAlert
          variant="info"
          title="Phiên khôi phục mật khẩu không hợp lệ"
          message="Vui lòng thực hiện lại bước xác thực OTP trước khi đặt mật khẩu mới."
        />
      </AuthScreenShell>
    );
  }

  const handleSubmit = async () => {
    const errors: Record<string, string | null> = {};

    if (newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu mới tối thiểu 6 ký tự';
    }
    if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setServerError(null);
    setIsSubmitting(true);

    try {
      const response = await authService.resetForgotPassword({
        email: resetEmail,
        resetToken,
        newPassword,
      });
      setPendingPasswordReset(null);
      setSuccessMessage(response.message);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setServerError(error.message);
      } else {
        setServerError('Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      header={{
        variant: 'back',
        backLabel: 'Quay lại',
        onBack: () => router.back(),
        title: 'ĐẶT LẠI MẬT KHẨU',
        subtitle: `Tạo mật khẩu mới cho ${displayResetEmail}`,
      }}
      footer={
        <AuthButton
          label="LƯU MẬT KHẨU MỚI"
          onPress={handleSubmit}
          loading={isSubmitting}
        />
      }>
      {serverError ? (
        <AuthAlert title="Không thể đặt lại mật khẩu" message={serverError} />
      ) : null}

      <View style={styles.fields}>
        <AuthInput
          label="Mật khẩu mới"
          placeholder="Tối thiểu 6 ký tự"
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            if (fieldErrors.newPassword) {
              setFieldErrors((prev) => ({ ...prev, newPassword: null }));
            }
            if (serverError) setServerError(null);
          }}
          error={fieldErrors.newPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
        />

        <AuthInput
          label="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu mới"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (fieldErrors.confirmPassword) {
              setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
            }
            if (serverError) setServerError(null);
          }}
          error={fieldErrors.confirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
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
  card: {
    borderRadius: Radius.card,
    borderWidth: BorderWidth.default,
    padding: Spacing.lg,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBody: {
    flex: 1,
    gap: 4,
  },
});
