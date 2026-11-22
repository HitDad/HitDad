import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthHeader } from '@/components/auth';
import { BorderWidth, MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ClubTabScreen() {
  const colors = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <AuthHeader
        variant="brand"
        title="THÀNH VIÊN"
        subtitle="Danh bạ câu lạc bộ CSE FC HCMUT"
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primarySurface }]}>
            <Ionicons name="shield-outline" size={26} color={colors.primary} />
          </View>
          <Text style={[Typography.section15, { color: colors.text }]}>
            Danh sách thành viên CLB (Task T-23)
          </Text>
          <Text style={[Typography.body14, styles.desc, { color: colors.textSecondary }]}>
            Màn hình quản lý thành viên, phân hạng Tier, thủ môn và duyệt đơn gia nhập (kết nối{' '}
            <Text style={[Typography.metaStrong13, { color: colors.primary }]}>
              GET /api/users/members
            </Text>
            ) đang được hoàn thiện ở Task T-23.
          </Text>
        </View>
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
    width: '100%',
    maxWidth: MaxContentWidth + Spacing.screen * 2,
    alignSelf: 'center',
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: BorderWidth.default,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desc: {
    textAlign: 'center',
  },
});
