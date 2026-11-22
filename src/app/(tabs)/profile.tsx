import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton, AuthHeader } from '@/components/auth';
import {
  BorderWidth,
  Elevation,
  MaxContentWidth,
  Radius,
  Spacing,
  TierColors,
  Typography,
} from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { normalizeSkillTier } from '@/types';
import { getUserInitials } from '@/utils/format';

export default function ProfileTabScreen() {
  const colors = useTheme();
  const { user, signOut } = useAuth();

  const tierKey = normalizeSkillTier(user?.tier);
  const tierStyle = TierColors[tierKey];

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <AuthHeader variant="brand" title="TÀI KHOẢN" subtitle="Hồ sơ và cài đặt của bạn" />

      <ScrollView contentContainerStyle={styles.content}>
        {user ? (
          <View
            style={[
              styles.card,
              Elevation.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.headerRow}>
              <View style={[styles.avatar, { backgroundColor: colors.primarySurface }]}>
                <Text style={[Typography.title14, { color: colors.primary }]}>
                  {getUserInitials(user.displayName)}
                </Text>
              </View>

              <View style={styles.identity}>
                <View style={styles.nameRow}>
                  <Text
                    style={[Typography.section15, styles.displayName, { color: colors.text }]}
                    numberOfLines={1}>
                    {user.displayName}
                  </Text>
                  <View
                    style={[
                      styles.tierBadge,
                      {
                        backgroundColor: tierStyle.background,
                        borderColor: tierStyle.border,
                        borderStyle: tierStyle.dashed ? 'dashed' : 'solid',
                      },
                    ]}>
                    <Text style={[Typography.tier15, { color: tierStyle.text }]}>{tierKey}</Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={[Typography.small12, { color: colors.textSecondary }]}>
                  @{user.username} · {user.role === 'ADMIN' ? 'Ban quản trị (Admin)' : 'Thành viên'}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Text style={[Typography.small12, styles.infoLabel, { color: colors.textSecondary }]}>
                  Email
                </Text>
                <Text
                  numberOfLines={1}
                  style={[Typography.metaStrong13, styles.infoValue, { color: colors.text }]}>
                  {user.email ?? 'Chưa cập nhật'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[Typography.small12, styles.infoLabel, { color: colors.textSecondary }]}>
                  Số điện thoại
                </Text>
                <Text
                  numberOfLines={1}
                  style={[Typography.metaStrong13, styles.infoValue, { color: colors.text }]}>
                  {user.phone ?? 'Chưa cập nhật'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[Typography.small12, styles.infoLabel, { color: colors.textSecondary }]}>
                  Vị trí
                </Text>
                <Text
                  numberOfLines={1}
                  style={[Typography.metaStrong13, styles.infoValue, { color: colors.text }]}>
                  {user.isGoalkeeper ? 'Thủ môn' : 'Cầu thủ sân'}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <AuthButton
          label="Đăng xuất"
          variant="secondary"
          onPress={() => {
            void signOut();
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: Spacing.screen,
    gap: Spacing.lg,
    width: '100%',
    maxWidth: MaxContentWidth + Spacing.screen * 2,
    alignSelf: 'center',
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: BorderWidth.hairline,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  identity: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  displayName: {
    flexShrink: 1,
  },
  tierBadge: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: BorderWidth.default,
  },
  divider: {
    height: 1,
  },
  infoList: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoLabel: {
    flexShrink: 0,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
  },
});
