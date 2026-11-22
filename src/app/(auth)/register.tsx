import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthAlert, AuthButton, AuthInput, AuthScreenShell } from '@/components/auth';
import { Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { ApiClientError } from '@/services/api';
import { authService } from '@/services/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VN_PHONE_REGEX = /^0\d{9}$/;

export default function RegisterScreen() {
  const colors = useTheme();
  const { setPendingRegistration } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (key: string) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: null }));
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async () => {
    const trimmedDisplayName = displayName.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const cleanedPhone = phone.replace(/\s+/g, '');

    const errors: Record<string, string | null> = {};

    if (!trimmedDisplayName) {
      errors.displayName = 'Vui lòng nhập họ và tên hiển thị';
    } else if (trimmedDisplayName.length > 50) {
      errors.displayName = 'Tên hiển thị tối đa 50 ký tự';
    }

    if (!trimmedUsername) {
      errors.username = 'Vui lòng nhập tên đăng nhập';
    } else if (trimmedUsername.length < 3 || /\s/.test(trimmedUsername)) {
      errors.username = 'Tên đăng nhập tối thiểu 3 ký tự và không chứa dấu cách';
    }

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Vui lòng nhập địa chỉ email hợp lệ';
    }

    if (cleanedPhone && !VN_PHONE_REGEX.test(cleanedPhone)) {
      errors.phone = 'Số điện thoại hợp lệ gồm 10 chữ số (bắt đầu bằng 0)';
    }

    if (password.length < 6) {
      errors.password = 'Mật khẩu tối thiểu 6 ký tự';
    }

    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setServerError(null);
    setIsSubmitting(true);

    try {
      await authService.sendRegisterOtp({
        email: trimmedEmail,
        username: trimmedUsername,
        phone: cleanedPhone || undefined,
      });

      setPendingRegistration({
        username: trimmedUsername,
        password,
        displayName: trimmedDisplayName,
        email: trimmedEmail,
        phone: cleanedPhone || undefined,
      });

      router.push({
        pathname: '/(auth)/verify-otp',
        params: { mode: 'register' },
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setServerError(error.message);
      } else {
        setServerError('Không thể gửi mã OTP. Vui lòng kiểm tra kết nối mạng và thử lại.');
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
        title: 'ĐĂNG KÝ',
        subtitle: 'Tạo tài khoản thành viên mới',
      }}
      footer={
        <>
          <AuthButton
            label="TIẾP TỤC · GỬI MÃ OTP"
            onPress={handleSubmit}
            loading={isSubmitting}
          />
          <View style={styles.linkRow}>
            <Text style={[Typography.meta13, { color: colors.textSecondary }]}>
              Đã có tài khoản?
            </Text>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              hitSlop={8}
              accessibilityRole="button"
              style={({ pressed }) => pressed && styles.pressed}>
              <Text style={[Typography.metaStrong13, { color: colors.primary }]}>
                Đăng nhập ngay
              </Text>
            </Pressable>
          </View>
        </>
      }>
      {serverError ? (
        <AuthAlert title="Không thể gửi mã xác thực" message={serverError} />
      ) : null}

      <View style={styles.fields}>
        <AuthInput
          label="Họ và tên hiển thị"
          placeholder="Nguyễn Văn A"
          value={displayName}
          maxLength={50}
          onChangeText={(text) => {
            setDisplayName(text);
            clearFieldError('displayName');
          }}
          error={fieldErrors.displayName}
          autoComplete="name"
          textContentType="name"
        />

        <AuthInput
          label="Tên đăng nhập"
          placeholder="nguyenvana"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            clearFieldError('username');
          }}
          error={fieldErrors.username}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
        />

        <AuthInput
          label="Email"
          placeholder="nguyenvana@gmail.com"
          helperText="Dùng để nhận mã OTP xác thực"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearFieldError('email');
          }}
          error={fieldErrors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
        />

        <AuthInput
          label="Số điện thoại (không bắt buộc)"
          placeholder="0912 345 678"
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            clearFieldError('phone');
          }}
          error={fieldErrors.phone}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
        />

        <AuthInput
          label="Mật khẩu"
          placeholder="Tối thiểu 6 ký tự"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            clearFieldError('password');
          }}
          error={fieldErrors.password}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <Text style={[Typography.headerSub11, { color: colors.textSecondary }]}>
          Bằng cách đăng ký, bạn đồng ý tuân thủ quy chế sinh hoạt và nội quy quỹ đội bóng HitDad FC.
        </Text>
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: Spacing.lg,
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
