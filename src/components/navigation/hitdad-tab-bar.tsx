import { Ionicons } from '@expo/vector-icons';
import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BorderWidth, MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

interface TabMeta {
  label: string;
  activeIcon: ComponentProps<typeof Ionicons>['name'];
  inactiveIcon: ComponentProps<typeof Ionicons>['name'];
}

const TAB_CONFIG: Record<string, TabMeta> = {
  index: {
    label: 'Lịch đá',
    activeIcon: 'calendar',
    inactiveIcon: 'calendar-outline',
  },
  club: {
    label: 'CLB',
    activeIcon: 'shield',
    inactiveIcon: 'shield-outline',
  },
  profile: {
    label: 'Tôi',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
};

/**
 * Custom 3-tab bottom navigation bar replicating Figma `Bottom nav` (`#1:369`, `EL-b76f4833`)
 * with active sky pill indicator.
 */
export function HitDadTabBar({ state, emitter, navigateToTab }: TabBarProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}>
      <View style={styles.inner}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const meta = TAB_CONFIG[route.name] ?? {
            label: route.name,
            activeIcon: 'ellipse',
            inactiveIcon: 'ellipse-outline',
          };

          const handlePress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={handlePress}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={meta.label}
              style={({ pressed }) => [styles.tabItem, pressed && styles.pressed]}>
              <View
                style={[
                  styles.pill,
                  isFocused && { backgroundColor: colors.primarySurface },
                ]}>
                <Ionicons
                  name={isFocused ? meta.activeIcon : meta.inactiveIcon}
                  size={20}
                  color={isFocused ? colors.primary : colors.textSecondary}
                />
              </View>
              <Text
                numberOfLines={1}
                style={[
                  Typography.nav11,
                  { color: isFocused ? colors.primary : colors.textSecondary },
                ]}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: BorderWidth.hairline,
    paddingTop: 10,
    paddingHorizontal: Spacing.screen,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
