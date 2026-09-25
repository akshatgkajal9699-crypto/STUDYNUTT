import React, { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export function Screen({
  children,
  scroll = true,
  contentStyle,
}: PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}>) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'web' ? 83 : insets.top + 16;
  const paddingBottom = Platform.OS === 'web' ? 118 : insets.bottom + 108;
  const contents = (
    <View
      style={[
        styles.content,
        {
          paddingHorizontal: 20,
          paddingTop,
          paddingBottom,
          backgroundColor: colors.background,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <View style={[styles.page, { backgroundColor: colors.background }]}>
        {contents}
      </View>
    );
  }
  return (
    <ScrollView
      style={[styles.page, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {contents}
    </ScrollView>
  );
}

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleCopy}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text>
        ) : null}
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function SectionHeading({
  title,
  action,
}: {
  title: string;
  action?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action ? (
        <Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text>
      ) : null}
    </View>
  );
}

export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Tag({
  children,
  tone = 'primary',
}: PropsWithChildren<{ tone?: 'primary' | 'green' | 'neutral' | 'warning' }>) {
  const colors = useColors();
  const palette =
    tone === 'green'
      ? { backgroundColor: colors.emeraldSoft, color: colors.accentForeground }
      : tone === 'warning'
        ? { backgroundColor: colors.warningSoft, color: colors.warning }
        : tone === 'neutral'
          ? { backgroundColor: colors.muted, color: colors.mutedForeground }
          : { backgroundColor: colors.primarySoft, color: colors.primary };
  return (
    <View style={[styles.tag, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.tagText, { color: palette.color }]}>{children}</Text>
    </View>
  );
}

export function ActionButton({
  title,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  loading = false,
  compact = false,
  testID,
}: {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  testID?: string;
}) {
  const colors = useColors();
  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.destructive
        : variant === 'secondary'
          ? colors.secondary
          : 'transparent';
  const foregroundColor =
    variant === 'primary' || variant === 'danger'
      ? colors.primaryForeground
      : variant === 'secondary'
        ? colors.secondaryForeground
        : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.actionButton,
        compact && styles.actionButtonCompact,
        {
          backgroundColor,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
          borderColor: variant === 'quiet' ? 'transparent' : colors.border,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foregroundColor} size="small" />
      ) : icon ? (
        <Feather name={icon} size={16} color={foregroundColor} />
      ) : null}
      <Text style={[styles.actionText, { color: foregroundColor }]}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  tone = 'neutral',
  testID,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  label: string;
  tone?: 'neutral' | 'primary' | 'green';
  testID?: string;
}) {
  const colors = useColors();
  const tint =
    tone === 'green'
      ? colors.emerald
      : tone === 'primary'
        ? colors.primary
        : colors.mutedForeground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
    >
      <Feather name={icon} size={19} color={tint} />
    </Pressable>
  );
}

export function ProgressBar({
  progress,
  color,
  height = 8,
}: {
  progress: number;
  color?: string;
  height?: number;
}) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      style={{
        width: '100%',
        height,
        borderRadius: height / 2,
        backgroundColor: colors.muted,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${Math.min(100, Math.max(0, progress * 100))}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: color ?? colors.primary,
        }}
      />
    </View>
  );
}

export function FieldLabel({ children }: PropsWithChildren) {
  const colors = useColors();
  return (
    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
      {children}
    </Text>
  );
}

export function BodyText({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  const colors = useColors();
  return (
    <Text style={[styles.body, { color: colors.mutedForeground }, style]}>
      {children}
    </Text>
  );
}

export const uiStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  gap16: { gap: 16 },
  gap20: { gap: 20 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

const styles = StyleSheet.create({
  page: { flex: 1, width: '100%' },
  scrollContent: { flexGrow: 1 },
  content: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleCopy: { flex: 1, gap: 5 },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  pageTitle: { fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -0.8 },
  pageSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.3 },
  sectionAction: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  card: { borderWidth: 1, padding: 16, gap: 12 },
  tag: { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  tagText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.45, textTransform: 'uppercase' },
  actionButton: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonCompact: { minHeight: 38, paddingVertical: 8, paddingHorizontal: 12 },
  actionText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
});