import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth';
import { BorderWidth, MaxContentWidth, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  buildCalendarMonthCells,
  formatReadableDate,
  getRelativeIsoDate,
  getUpcomingWeekdayDate,
  HOURS_OPTIONS,
  MINUTES_OPTIONS,
  parseIsoDateOnly,
  QUICK_TIME_PRESETS,
  WEEKDAY_HEADERS,
} from '@/utils/date-time-picker';

export interface DatePickerFieldProps {
  label?: string;
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  compact?: boolean;
  helperText?: string;
  rightActionLabel?: string;
  onRightActionPress?: () => void;
  disabled?: boolean;
}

/**
 * Dropdown date-picker trigger backed by a cross-platform HitDad bottom-sheet calendar modal
 * (`YYYY-MM-DD` contract preserved for forms & API payloads).
 */
export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Chọn ngày',
  compact = false,
  helperText,
  rightActionLabel,
  onRightActionPress,
  disabled = false,
}: DatePickerFieldProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const initialAnchor = parseIsoDateOnly(value) ?? new Date();
  const [viewYear, setViewYear] = useState(() => initialAnchor.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => initialAnchor.getMonth());

  const handleOpen = () => {
    if (disabled) return;
    const anchor = parseIsoDateOnly(value) ?? new Date();
    setViewYear(anchor.getFullYear());
    setViewMonth(anchor.getMonth());
    setOpen(true);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectDateAndClose = (iso: string) => {
    onChange(iso);
    setOpen(false);
  };

  const displayText = formatReadableDate(value, compact) || value.trim() || placeholder;
  const hasValue = Boolean(value.trim());
  const cells = buildCalendarMonthCells(viewYear, viewMonth);

  const quickDatePresets = [
    { label: 'Hôm nay', iso: getRelativeIsoDate(0) },
    { label: 'Ngày mai', iso: getRelativeIsoDate(1) },
    { label: 'Thứ Tư tới', iso: getUpcomingWeekdayDate(3) },
    { label: 'Thứ Sáu tới', iso: getUpcomingWeekdayDate(5) },
    { label: 'Chủ Nhật tới', iso: getUpcomingWeekdayDate(0) },
  ];

  return (
    <View style={styles.field}>
      {label || (rightActionLabel && onRightActionPress) ? (
        <View style={styles.labelRow}>
          {label ? (
            <Text style={[Typography.metaStrong13, { color: colors.text }]}>{label}</Text>
          ) : (
            <View />
          )}
          {rightActionLabel && onRightActionPress ? (
            <Pressable
              onPress={onRightActionPress}
              hitSlop={8}
              accessibilityRole="button"
              style={({ pressed }) => pressed && styles.pressed}>
              <Text style={[Typography.metaStrong13, { color: colors.primary }]}>
                {rightActionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Pressable
        onPress={handleOpen}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label ?? 'Chọn ngày'}
        style={({ pressed }) => [
          styles.triggerBox,
          compact && styles.triggerCompact,
          {
            backgroundColor: colors.surface,
            borderColor: open ? colors.borderActive : colors.border,
          },
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}>
        <Ionicons
          name="calendar-outline"
          size={compact ? 16 : 18}
          color={hasValue ? colors.primary : colors.textSecondary}
          style={styles.leadingIcon}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.triggerText,
            compact ? Typography.meta13 : Typography.body14,
            { color: hasValue ? colors.text : colors.textSecondary },
          ]}>
          {displayText}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={colors.textSecondary}
          style={styles.chevronIcon}
        />
      </Pressable>

      {helperText ? (
        <Text style={[Typography.headerSub11, { color: colors.textSecondary }]}>{helperText}</Text>
      ) : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, Spacing.screen),
              },
            ]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <View style={styles.sheetHeader}>
              <Text numberOfLines={1} style={[Typography.cardTitle24, styles.sheetTitle, { color: colors.text }]}>
                {label ?? 'Chọn ngày'}
              </Text>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: colors.surfaceMuted },
                  pressed && styles.pressed,
                ]}>
                <Ionicons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickChipsRow}>
              {quickDatePresets.map((preset) => {
                const selected = value === preset.iso;
                return (
                  <Pressable
                    key={preset.label}
                    onPress={() => selectDateAndClose(preset.iso)}
                    style={({ pressed }) => [
                      styles.presetChip,
                      {
                        backgroundColor: selected ? colors.primary : colors.primarySurface,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      numberOfLines={1}
                      style={[
                        Typography.chip12,
                        { color: selected ? colors.onPrimary : colors.primary },
                      ]}>
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.monthBar}>
              <Pressable
                onPress={handlePrevMonth}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Tháng trước"
                style={({ pressed }) => [
                  styles.monthNavBtn,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}>
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </Pressable>

              <Text style={[Typography.section15, { color: colors.text }]}>
                Tháng {String(viewMonth + 1).padStart(2, '0')} / {viewYear}
              </Text>

              <Pressable
                onPress={handleNextMonth}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Tháng sau"
                style={({ pressed }) => [
                  styles.monthNavBtn,
                  { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}>
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.calendarGrid}>
              {WEEKDAY_HEADERS.map((weekday) => (
                <View key={weekday} style={styles.weekdayCell}>
                  <Text style={[Typography.caption11, { color: colors.textSecondary }]}>
                    {weekday}
                  </Text>
                </View>
              ))}

              {cells.map((cell, index) => {
                if (!cell) {
                  return <View key={`blank-${index}`} style={styles.dayCellOuter} />;
                }

                const isSelected = value === cell.iso;
                return (
                  <View key={cell.iso} style={styles.dayCellOuter}>
                    <Pressable
                      onPress={() => selectDateAndClose(cell.iso)}
                      accessibilityRole="button"
                      accessibilityLabel={`Ngày ${cell.day}`}
                      style={({ pressed }) => [
                        styles.dayCellInner,
                        isSelected
                          ? { backgroundColor: colors.primary }
                          : cell.isToday
                            ? {
                                backgroundColor: colors.primarySurface,
                                borderColor: colors.primary,
                                borderWidth: BorderWidth.hairline,
                              }
                            : undefined,
                        pressed && styles.pressed,
                      ]}>
                      <Text
                        style={[
                          Typography.bodyMedium14,
                          {
                            color: isSelected
                              ? colors.onPrimary
                              : cell.isToday
                                ? colors.primary
                                : colors.text,
                          },
                        ]}>
                        {cell.day}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export interface TimePickerFieldProps {
  value: string;
  onChange: (hhmm: string) => void;
  title?: string;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
}

const VALID_HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Dropdown time-picker trigger backed by a cross-platform HitDad bottom-sheet time modal
 * with quick kickoff presets + Hour/Minute columns (`HH:mm` contract preserved).
 */
export function TimePickerField({
  value,
  onChange,
  title = 'Chọn giờ',
  placeholder = 'Chọn giờ',
  disabled = false,
  compact = false,
}: TimePickerFieldProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const [draftHour, setDraftHour] = useState('18');
  const [draftMinute, setDraftMinute] = useState('30');

  const handleOpen = () => {
    if (disabled) return;
    const match = value.trim().match(VALID_HHMM_REGEX);
    setDraftHour(match ? match[1] : '18');
    setDraftMinute(match ? match[2] : '30');
    setOpen(true);
  };

  const minuteOptions = MINUTES_OPTIONS.includes(draftMinute)
    ? [...MINUTES_OPTIONS]
    : [...MINUTES_OPTIONS, draftMinute].sort();

  const hasValue = Boolean(value.trim());
  const draftTime = `${draftHour}:${draftMinute}`;

  const selectPresetAndClose = (hhmm: string) => {
    onChange(hhmm);
    setOpen(false);
  };

  const handleConfirm = () => {
    onChange(draftTime);
    setOpen(false);
  };

  return (
    <View style={styles.field}>
      <Pressable
        onPress={handleOpen}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={({ pressed }) => [
          styles.triggerBox,
          compact && styles.triggerCompact,
          {
            backgroundColor: colors.surface,
            borderColor: open ? colors.borderActive : colors.border,
          },
          disabled && styles.disabled,
          pressed && !disabled && styles.pressed,
        ]}>
        {!compact ? (
          <Ionicons
            name="time-outline"
            size={17}
            color={hasValue ? colors.primary : colors.textSecondary}
            style={styles.leadingIcon}
          />
        ) : null}
        <Text
          numberOfLines={1}
          style={[
            styles.triggerText,
            compact && styles.centeredText,
            Typography.bodyMedium14,
            { color: hasValue ? colors.text : colors.textSecondary },
          ]}>
          {hasValue ? value : placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={colors.textSecondary}
          style={styles.chevronIcon}
        />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, Spacing.screen),
              },
            ]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <View style={styles.sheetHeader}>
              <Text numberOfLines={1} style={[Typography.cardTitle24, styles.sheetTitle, { color: colors.text }]}>
                {title}
              </Text>
              <View style={[styles.liveTimeBadge, { backgroundColor: colors.primarySurface }]}>
                <Text style={[Typography.time20, { color: colors.primary }]}>{draftTime}</Text>
              </View>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: colors.surfaceMuted },
                  pressed && styles.pressed,
                ]}>
                <Ionicons name="close" size={18} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.presetsSection}>
              <Text style={[Typography.small12, { color: colors.textSecondary }]}>
                Chọn nhanh khung giờ phổ biến
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickChipsRow}>
                {QUICK_TIME_PRESETS.map((preset) => {
                  const selected = value === preset || draftTime === preset;
                  return (
                    <Pressable
                      key={preset}
                      onPress={() => selectPresetAndClose(preset)}
                      style={({ pressed }) => [
                        styles.presetChip,
                        {
                          backgroundColor: selected ? colors.primary : colors.primarySurface,
                        },
                        pressed && styles.pressed,
                      ]}>
                      <Text
                        numberOfLines={1}
                        style={[
                          Typography.chip12,
                          { color: selected ? colors.onPrimary : colors.primary },
                        ]}>
                        {preset}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.columnsRow}>
              <View style={styles.timeColWrap}>
                <Text style={[Typography.caption11, styles.colHeading, { color: colors.textSecondary }]}>
                  GIỜ
                </Text>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={[
                    styles.wheelList,
                    { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                  ]}>
                  {HOURS_OPTIONS.map((hour) => {
                    const selected = draftHour === hour;
                    return (
                      <Pressable
                        key={hour}
                        onPress={() => setDraftHour(hour)}
                        style={({ pressed }) => [
                          styles.wheelItem,
                          selected && { backgroundColor: colors.primary },
                          pressed && !selected && styles.pressed,
                        ]}>
                        <Text
                          style={[
                            Typography.bodyMedium14,
                            { color: selected ? colors.onPrimary : colors.text },
                          ]}>
                          {hour}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.timeColWrap}>
                <Text style={[Typography.caption11, styles.colHeading, { color: colors.textSecondary }]}>
                  PHÚT
                </Text>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={[
                    styles.wheelList,
                    { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                  ]}>
                  {minuteOptions.map((minute) => {
                    const selected = draftMinute === minute;
                    return (
                      <Pressable
                        key={minute}
                        onPress={() => setDraftMinute(minute)}
                        style={({ pressed }) => [
                          styles.wheelItem,
                          selected && { backgroundColor: colors.primary },
                          pressed && !selected && styles.pressed,
                        ]}>
                        <Text
                          style={[
                            Typography.bodyMedium14,
                            { color: selected ? colors.onPrimary : colors.text },
                          ]}>
                          {minute}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <AuthButton label={`Chọn ${draftTime}`} onPress={handleConfirm} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  triggerBox: {
    minHeight: 44,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  triggerCompact: {
    paddingHorizontal: 10,
    gap: 6,
  },
  leadingIcon: {
    flexShrink: 0,
  },
  triggerText: {
    flex: 1,
    minWidth: 0,
  },
  centeredText: {
    textAlign: 'center',
  },
  chevronIcon: {
    flexShrink: 0,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.78,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 42, 107, 0.45)',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: 10,
    paddingHorizontal: Spacing.screen,
    gap: Spacing.md,
    maxHeight: '86%',
    width: '100%',
    maxWidth: MaxContentWidth + Spacing.screen * 2,
    alignSelf: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sheetTitle: {
    flex: 1,
    minWidth: 0,
  },
  liveTimeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    flexShrink: 0,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  quickChipsRow: {
    gap: Spacing.sm,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekdayCell: {
    width: '14.2857%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayCellOuter: {
    width: '14.2857%',
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsSection: {
    gap: Spacing.xs,
  },
  columnsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timeColWrap: {
    flex: 1,
    gap: 6,
  },
  colHeading: {
    textAlign: 'center',
  },
  wheelList: {
    height: 220,
    borderRadius: Radius.card,
    borderWidth: BorderWidth.default,
  },
  wheelItem: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
