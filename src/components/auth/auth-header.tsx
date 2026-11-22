import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Palette, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface AuthHeaderProps {
  variant: 'brand' | 'back';
  title: string;
  subtitle: string;
  backLabel?: string;
  onBack?: () => void;
}

/**
 * Blue HitDad auth hero header replicating Figma frames 00a and 00b
 * with pitch-line texture and safe-area support.
 */
export function AuthHeader({
  variant,
  title,
  subtitle,
  backLabel = 'Trở về Đăng nhập',
  onBack,
}: AuthHeaderProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.primary, paddingTop: insets.top + 6 }]}>
      <Image
        source={require('@/assets/images/hitdad-pitch-lines.png')}
        style={styles.pitchOverlay}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />

      <View style={styles.inner}>
        {variant === 'brand' ? (
          <View style={styles.brandRow}>
            <View style={[styles.crestCircle, { backgroundColor: Palette.white }]}>
              <Image
                source={require('@/assets/images/hitdad-crest.png')}
                style={styles.crestImage}
                contentFit="contain"
              />
            </View>
            <View style={styles.brandTextGroup}>
              <Text style={[Typography.title14, { color: colors.onPrimary }]}>HitDad</Text>
              <Text style={[Typography.headerSub11, { color: colors.onPrimaryMuted }]}>
                CSE FC HCMUT
              </Text>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}>
            <View style={[styles.backCircle, { backgroundColor: colors.onPrimaryOverlay }]}>
              <Ionicons name="arrow-back" size={18} color={colors.onPrimary} />
            </View>
            <Text style={[Typography.title14, { color: colors.onPrimary }]}>{backLabel}</Text>
          </Pressable>
        )}

        <View style={styles.titleBlock}>
          <Text style={[Typography.display40, { color: colors.onPrimary }]}>{title}</Text>
          <Text style={[Typography.meta13, { color: Palette.sky }]}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    paddingHorizontal: Spacing.screen,
    paddingBottom: 22,
  },
  pitchOverlay: {
    ...StyleSheet.absoluteFill,
    opacity: 0.16,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: 20,
  },
  brandRow: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  crestCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crestImage: {
    width: 26,
    height: 26,
  },
  brandTextGroup: {
    flex: 1,
  },
  backRow: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'flex-start',
  },
  backCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
  titleBlock: {
    gap: 4,
  },
});
