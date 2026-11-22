import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AuthAlert,
  type AuthAlertVariant,
  AuthButton,
  AuthScreenShell,
  OtpCodeInput,
} from '@/components/auth';
import { BorderWidth, Elevation, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { ApiClientError } from '@/services/api';
import { authService } from '@/services/auth';
import type { AuthUser } from '@/types';

const RESEND_SECONDS = 60;

interface AlertState {
  variant: AuthAlertVariant;
  title: string;
  message: string;
}

interface RegisterSuccessState {
  message: string;
  user: AuthUser;
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function VerifyOtpScreen() {
  const colors = useTheme();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = params.mode === 'forgot-password' ? 'forgot-password' : 'register';

  const {
    pendingRegistration,
    pendingPasswordReset,
    setPendingRegistration,
    setPendingPasswordReset,
  } = useAuth();

  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<RegisterSuccessState | null>(null);

  const targetEmail =
    mode === 'register' ? pendingRegistration?.email : pendingPasswordReset?.email;
  const displayEmail =
    mode === 'register'
      ? pendingRegistration?.email
      : pendingPasswordReset?.maskedEmail || pendingPasswordReset?.email;

  useEffect(() => {
    if (secondsLeft <= 0 || registerSuccess) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, registerSuccess]);

  if (registerSuccess) {
    return (
      <AuthScreenShell
        header={{
          variant: 'back',
          backLabel: 'Đăng nhập',
          onBack: () => router.replace('/(auth)/login'),
          title: 'HOÀN TẤT ĐĂNG KÝ',
          subtitle: 'Đơn gia nhập CLB đang chờ quản trị viên phê duyệt',
        }}
        footer={
          <AuthButton
            label="TRỞ VỀ ĐĂNG NHẬP"
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
            <View style={[styles.statusIconCircle, { backgroundColor: colors.successBackground }]}>
              <Ionicons name="checkmark-circle" size={28} color={colors.success} />
            </View>
            <View style={styles.successTitleGroup}>
              <Text style={[Typography.section15, { color: colors.text }]}>
                Đã gửi đơn gia nhập CLB
              </Text>
              <Text style={[Typography.small12, { color: colors.textSecondary }]}>
                {registerSuccess.message}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryList}>
            <View style={styles.summaryRow}>
              <Text style={[Typography.small12, { color: colors.textSecondary }]}>Họ và tên</Text>
              <Text style={[Typography.metaStrong13, { color: colors.text }]}>
                {registerSuccess.user.displayName}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[Typography.small12, { color: colors.textSecondary }]}>Tên đăng nhập</Text>
              <Text style={[Typography.metaStrong13, { color: colors.text }]}>
                @{registerSuccess.user.username}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[Typography.small12, { color: colors.textSecondary }]}>Email</Text>
              <Text style={[Typography.metaStrong13, { color: colors.text }]}>
                {registerSuccess.user.email ?? '—'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[Typography.small12, { color: colors.textSecondary }]}>Trạng thái</Text>
              <View style={[styles.chip, { backgroundColor: colors.warningBackground }]}>
                <Text style={[Typography.chip12, { color: colors.warning }]}>Chờ Admin duyệt</Text>
              </View>
            </View>
          </View>
        </View>
      </AuthScreenShell>
    );
  }

  if (!targetEmail) {
    return (
      <AuthScreenShell
        header={{
          variant: 'back',
          backLabel: 'Trở về Đăng nhập',
          onBack: () => router.replace('/(auth)/login'),
          title: 'XÁC THỰC OTP',
          subtitle: 'Phiên xác thực đã hết hạn hoặc bị làm mới',
        }}
        footer={
          <AuthButton
            label="TRỞ VỀ ĐĂNG NHẬP"
            onPress={() => router.replace('/(auth)/login')}
          />
        }>
        <AuthAlert
          variant="info"
          title="Không tìm thấy phiên xác thực"
          message="Vui lòng thực hiện lại thao tác đăng ký hoặc khôi phục mật khẩu để nhận mã OTP mới."
        />
      </AuthScreenShell>
    );
  }

  const handleVerify = async (codeOverride?: string) => {
    const code = (codeOverride ?? otp).trim();
    if (code.length !== 6) {
      setAlert({
        variant: 'error',
        title: 'Mã OTP chưa đầy đủ',
        message: 'Vui lòng nhập đủ 6 chữ số được gửi về email.',
      });
      return;
    }

    setAlert(null);
    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        if (!pendingRegistration) {
          throw new Error('Thiếu thông tin đăng ký.');
        }
        const verified = await authService.verifyRegisterOtp({
          email: pendingRegistration.email,
          otp: code,
        });
        const registered = await authService.register({
          username: pendingRegistration.username,
          password: pendingRegistration.password,
          displayName: pendingRegistration.displayName,
          email: pendingRegistration.email,
          phone: pendingRegistration.phone,
          verificationToken: verified.verificationToken,
        });

        setPendingRegistration(null);
        setRegisterSuccess({
          message: registered.message,
          user: registered.user,
        });
      } else {
        if (!pendingPasswordReset) {
          throw new Error('Thiếu thông tin khôi phục mật khẩu.');
        }
        const verified = await authService.verifyForgotPasswordOtp({
          email: pendingPasswordReset.email,
          otp: code,
        });
        setPendingPasswordReset({
          ...pendingPasswordReset,
          resetToken: verified.resetToken,
        });
        router.push('/(auth)/reset-password');
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        setAlert({
          variant: 'error',
          title: 'Xác thực OTP thất bại',
          message: error.message,
        });
      } else {
        setAlert({
          variant: 'error',
          title: 'Đã xảy ra lỗi',
          message: 'Không thể xác thực mã OTP. Vui lòng thử lại.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || isResending) return;
    setAlert(null);
    setIsResending(true);

    try {
      if (mode === 'register' && pendingRegistration) {
        await authService.sendRegisterOtp({
          email: pendingRegistration.email,
          username: pendingRegistration.username,
          phone: pendingRegistration.phone,
        });
      } else if (mode === 'forgot-password' && pendingPasswordReset) {
        await authService.sendForgotPasswordOtp({
          emailOrUsername: pendingPasswordReset.email,
        });
      }

      setOtp('');
      setSecondsLeft(RESEND_SECONDS);
      setAlert({
        variant: 'success',
        title: 'Đã gửi lại mã OTP',
        message: `Mã xác thực mới đã được gửi tới ${displayEmail}.`,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setAlert({
          variant: 'error',
          title: 'Không thể gửi lại mã OTP',
          message: error.message,
        });
      } else {
        setAlert({
          variant: 'error',
          title: 'Lỗi kết nối',
          message: 'Không thể gửi lại mã OTP lúc này.',
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthScreenShell
      header={{
        variant: 'back',
        backLabel: 'Quay lại',
        onBack: () => router.back(),
        title: 'XÁC THỰC OTP',
        subtitle: 'Nhập mã 6 chữ số đã gửi về email của bạn',
      }}
      footer={
        <AuthButton
          label={mode === 'register' ? 'XÁC NHẬN & TẠO TÀI KHOẢN' : 'XÁC NHẬN MÃ OTP'}
          onPress={() => handleVerify()}
          loading={isSubmitting}
          disabled={otp.length !== 6}
        />
      }>
      <View
        style={[
          styles.card,
          Elevation.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <View style={styles.emailRow}>
          <View style={[styles.mailBadge, { backgroundColor: colors.primarySurface }]}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.emailInfo}>
            <Text style={[Typography.small12, { color: colors.textSecondary }]}>
              Mã xác thực đã được gửi tới
            </Text>
            <Text style={[Typography.title14, { color: colors.text }]} numberOfLines={1}>
              {displayEmail}
            </Text>
          </View>
        </View>

        <View style={styles.waitingRow}>
          <View style={[styles.chip, { backgroundColor: colors.primarySurface }]}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={[Typography.chip12, { color: colors.primary }]}>
              {secondsLeft > 0
                ? `Đang chờ · ${formatCountdown(secondsLeft)}`
                : 'Có thể gửi lại mã'}
            </Text>
          </View>
          <Text style={[Typography.headerSub11, { color: colors.textSecondary }]}>
            Hiệu lực 1 lần
          </Text>
        </View>
      </View>

      {alert ? (
        <AuthAlert variant={alert.variant} title={alert.title} message={alert.message} />
      ) : null}

      <View style={styles.otpSection}>
        <Text style={[Typography.metaStrong13, { color: colors.text }]}>Mã xác thực (OTP)</Text>
        <OtpCodeInput
          value={otp}
          onChange={(code) => {
            setOtp(code);
            if (alert?.variant === 'error') setAlert(null);
          }}
          hasError={alert?.variant === 'error'}
          disabled={isSubmitting}
          onComplete={(code) => {
            void handleVerify(code);
          }}
        />
      </View>

      <View style={styles.resendSection}>
        {secondsLeft > 0 ? (
          <Text style={[Typography.meta13, { color: colors.textSecondary }]}>
            Chưa nhận được mã? Gửi lại sau{' '}
            <Text style={[Typography.metaStrong13, { color: colors.primary }]}>
              {formatCountdown(secondsLeft)}
            </Text>
          </Text>
        ) : (
          <Pressable
            onPress={handleResend}
            disabled={isResending}
            hitSlop={8}
            accessibilityRole="button"
            style={({ pressed }) => pressed && styles.pressed}>
            <Text style={[Typography.metaStrong13, { color: colors.primary }]}>
              {isResending ? 'Đang gửi lại mã...' : 'Gửi lại mã OTP'}
            </Text>
          </Pressable>
        )}

        <Text style={[Typography.headerSub11, styles.spamHint, { color: colors.textSecondary }]}>
          Kiểm tra cả hộp thư Spam / Quảng cáo nếu chưa thấy email.
        </Text>
      </View>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    borderWidth: BorderWidth.default,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  mailBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailInfo: {
    flex: 1,
    gap: 2,
  },
  waitingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  otpSection: {
    gap: Spacing.sm,
  },
  resendSection: {
    alignItems: 'center',
    gap: 6,
  },
  spamHint: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitleGroup: {
    flex: 1,
    gap: 4,
  },
  divider: {
    height: 1,
  },
  summaryList: {
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
