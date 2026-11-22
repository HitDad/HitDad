/**
 * HitDad Design System tokens extracted from Figma (Figma-HitDad)
 * alongside Light/Dark semantic mappings.
 */

import '@/global.css';

import { Platform, type TextStyle, type ViewStyle } from 'react-native';

import type { SkillTier } from '@/types/common';

/** Raw color palette matching named tokens and fills in Figma-HitDad. */
export const Palette = {
  blue: '#1546C8',
  blueLight: '#9DB4EA',
  navy: '#0A2A6B',
  white: '#FFFFFF',
  canvas: '#F4F7FC',
  sky: '#E9F0FF',
  ink2: '#4A5878',
  line: '#D3DDF2',
  doneBg: '#F7F9FE',
  selectedBg: '#F4F7FF',
  surfaceMuted: '#EEF2FA',
  success: '#2F9E44',
  successBg: '#EBFBEE',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  danger: '#DC2626',
  dangerText: '#991B1B',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FCA5A5',
  whiteOverlay14: 'rgba(255, 255, 255, 0.14)',
  whiteOverlay16: 'rgba(255, 255, 255, 0.16)',
} as const;

export const Colors = {
  light: {
    text: Palette.navy,
    textSecondary: Palette.ink2,
    background: Palette.white,
    canvas: Palette.canvas,
    backgroundElement: Palette.doneBg,
    backgroundSelected: Palette.selectedBg,
    primary: Palette.blue,
    primaryLight: Palette.blueLight,
    primarySurface: Palette.sky,
    onPrimary: Palette.white,
    onPrimaryMuted: 'rgba(255, 255, 255, 0.88)',
    onPrimaryOverlay: Palette.whiteOverlay16,
    onPrimaryOverlaySoft: Palette.whiteOverlay14,
    navy: Palette.navy,
    surface: Palette.white,
    surfaceMuted: Palette.surfaceMuted,
    border: Palette.line,
    borderActive: Palette.blue,
    success: Palette.success,
    successBackground: Palette.successBg,
    warning: Palette.warning,
    warningBackground: Palette.warningBg,
    danger: Palette.danger,
    dangerText: Palette.dangerText,
    dangerBackground: Palette.dangerBg,
    dangerBorder: Palette.dangerBorder,
    tabIconDefault: Palette.ink2,
    tabIconSelected: Palette.blue,
  },
  dark: {
    text: '#F1F5FF',
    textSecondary: '#A8B7D8',
    background: '#0B1221',
    canvas: '#0B1221',
    backgroundElement: '#131D35',
    backgroundSelected: '#1A294A',
    primary: '#4B7BF5',
    primaryLight: Palette.blueLight,
    primarySurface: '#182A54',
    onPrimary: Palette.white,
    onPrimaryMuted: 'rgba(255, 255, 255, 0.85)',
    onPrimaryOverlay: Palette.whiteOverlay16,
    onPrimaryOverlaySoft: 'rgba(255, 255, 255, 0.12)',
    navy: '#DCE6FF',
    surface: '#111A2E',
    surfaceMuted: '#1B2742',
    border: '#243456',
    borderActive: '#4B7BF5',
    success: '#40C057',
    successBackground: '#132A1C',
    warning: '#F59E0B',
    warningBackground: '#2D210B',
    danger: '#EF4444',
    dangerText: '#FCA5A5',
    dangerBackground: '#2F1518',
    dangerBorder: '#7F1D1D',
    tabIconDefault: '#8C9EC4',
    tabIconSelected: '#4B7BF5',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export interface TierBadgeStyle {
  background: string;
  text: string;
  border: string;
  dashed: boolean;
}

/** Exact color tokens for Figma Tier=S/A/B/C/D/Mới badges. */
export const TierColors: Record<SkillTier, TierBadgeStyle> = {
  S: {
    background: Palette.navy,
    text: Palette.white,
    border: Palette.navy,
    dashed: false,
  },
  A: {
    background: Palette.blue,
    text: Palette.white,
    border: Palette.blue,
    dashed: false,
  },
  B: {
    background: Palette.sky,
    text: Palette.blue,
    border: Palette.sky,
    dashed: false,
  },
  C: {
    background: Palette.selectedBg,
    text: Palette.blue,
    border: Palette.line,
    dashed: false,
  },
  D: {
    background: Palette.white,
    text: Palette.ink2,
    border: Palette.line,
    dashed: false,
  },
  Mới: {
    background: Palette.white,
    text: Palette.ink2,
    border: Palette.line,
    dashed: true,
  },
};

/** Registered font family keys loaded via `@expo-google-fonts/*` in root layout. */
export const FontFamilies = {
  beVietnamRegular: 'BeVietnamPro_400Regular',
  beVietnamMedium: 'BeVietnamPro_500Medium',
  beVietnamSemiBold: 'BeVietnamPro_600SemiBold',
  beVietnamBold: 'BeVietnamPro_700Bold',
  barlowCondensedBold: 'BarlowCondensed_700Bold',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: FontFamilies.beVietnamRegular,
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: FontFamilies.beVietnamRegular,
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-sans)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/**
 * Figma text styles mapped to loaded font family names.
 * Note: `fontWeight` is intentionally omitted when using explicit weight-suffixed
 * font families so Android React Native does not fall back to system Roboto.
 */
export const Typography = {
  hero64: {
    fontFamily: FontFamilies.barlowCondensedBold,
    fontSize: 64,
    lineHeight: 70,
  },
  money60: {
    fontFamily: FontFamilies.barlowCondensedBold,
    fontSize: 60,
    lineHeight: 66,
  },
  display40: {
    fontFamily: FontFamilies.barlowCondensedBold,
    fontSize: 40,
    lineHeight: 48,
  },
  date36: {
    fontFamily: FontFamilies.barlowCondensedBold,
    fontSize: 36,
    lineHeight: 40,
  },
  date26: {
    fontFamily: FontFamilies.barlowCondensedBold,
    fontSize: 26,
    lineHeight: 30,
  },
  cardTitle24: {
    fontFamily: FontFamilies.barlowCondensedBold,
    fontSize: 24,
    lineHeight: 31,
  },
  teamTitle22: {
    fontFamily: FontFamilies.barlowCondensedBold,
    fontSize: 22,
    lineHeight: 28,
  },
  time20: {
    fontFamily: FontFamilies.barlowCondensedBold,
    fontSize: 20,
    lineHeight: 26,
  },
  tier15: {
    fontFamily: FontFamilies.barlowCondensedBold,
    fontSize: 15,
    lineHeight: 20,
  },
  section15: {
    fontFamily: FontFamilies.beVietnamSemiBold,
    fontSize: 15,
    lineHeight: 22,
  },
  button15: {
    fontFamily: FontFamilies.beVietnamSemiBold,
    fontSize: 15,
    lineHeight: 22,
  },
  title14: {
    fontFamily: FontFamilies.beVietnamSemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyMedium14: {
    fontFamily: FontFamilies.beVietnamMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  body14: {
    fontFamily: FontFamilies.beVietnamRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  metaStrong13: {
    fontFamily: FontFamilies.beVietnamSemiBold,
    fontSize: 13,
    lineHeight: 19,
  },
  tab13: {
    fontFamily: FontFamilies.beVietnamMedium,
    fontSize: 13,
    lineHeight: 19,
  },
  meta13: {
    fontFamily: FontFamilies.beVietnamRegular,
    fontSize: 13,
    lineHeight: 19,
  },
  chip12: {
    fontFamily: FontFamilies.beVietnamSemiBold,
    fontSize: 12,
    lineHeight: 17,
  },
  small12: {
    fontFamily: FontFamilies.beVietnamRegular,
    fontSize: 12,
    lineHeight: 17,
  },
  caption11: {
    fontFamily: FontFamilies.beVietnamSemiBold,
    fontSize: 11,
    lineHeight: 16,
  },
  nav11: {
    fontFamily: FontFamilies.beVietnamMedium,
    fontSize: 11,
    lineHeight: 16,
  },
  headerSub11: {
    fontFamily: FontFamilies.beVietnamRegular,
    fontSize: 11,
    lineHeight: 16,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof Typography;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  screen: 20,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  xs: 4,
  sm: 6,
  md: 10,
  card: 14,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const BorderWidth = {
  hairline: 1,
  default: 1.5,
  active: 2,
} as const;

export const Elevation: { card: ViewStyle } = {
  card:
    Platform.select<ViewStyle>({
      web: {
        boxShadow: '0px 10px 30px 0px rgba(10, 42, 107, 0.14)',
      },
      default: {
        shadowColor: Palette.navy,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.14,
        shadowRadius: 15,
        elevation: 6,
      },
    }) ?? {},
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 390;
