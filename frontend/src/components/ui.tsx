import { Ionicons } from '@expo/vector-icons';
import { ComponentProps, ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSize, radius, shadow, spacing, touchTarget } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/* ----------------------------------------------------------------- Screen */

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  /** Skip the top safe-area inset (when a navigation header is shown). */
  withHeader?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, scroll = true, withHeader = false, contentStyle }: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.screenContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screenContent, styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={withHeader ? ['left', 'right'] : ['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.centered}>{content}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------- Text */

type Variant = 'title' | 'heading' | 'body' | 'muted' | 'small';

export function AppText({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  return <Text {...props} style={[styles.text, textVariants[variant], style]} />;
}

/* ----------------------------------------------------------------- Button */

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
  compact,
}: ButtonProps) {
  const palette = buttonPalettes[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: pressed ? palette.pressed : palette.background, borderColor: palette.border },
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={compact ? 18 : 22} color={palette.text} />}
          <Text style={[styles.buttonText, compact && styles.buttonTextCompact, { color: palette.text }]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------------- TextField */

export function TextField({ label, hint, style, ...props }: TextInputProps & { label: string; hint?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[styles.input, focused && styles.inputFocused, props.multiline && styles.inputMultiline, style]}
      />
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

/* ------------------------------------------------------------------- Card */

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/* ---------------------------------------------------------------- Notice */

const noticeTones = {
  error: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle' },
  success: { bg: colors.successSoft, fg: colors.success, icon: 'checkmark-circle' },
  info: { bg: colors.surfaceMuted, fg: colors.primary, icon: 'information-circle' },
  warning: { bg: colors.warningSoft, fg: colors.warning, icon: 'warning' },
} as const;

export function Notice({ tone = 'error', children }: { tone?: keyof typeof noticeTones; children: ReactNode }) {
  const t = noticeTones[tone];
  return (
    <View style={[styles.notice, { backgroundColor: t.bg }]} accessibilityRole="alert">
      <Ionicons name={t.icon} size={22} color={t.fg} />
      <Text style={[styles.noticeText, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

/* ------------------------------------------------------------ EmptyState */

export function EmptyState({ icon, title, message }: { icon: IconName; title: string; message?: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <AppText variant="heading" style={styles.centerText}>
        {title}
      </AppText>
      {message && (
        <AppText variant="muted" style={styles.centerText}>
          {message}
        </AppText>
      )}
    </View>
  );
}

/* ----------------------------------------------------------------- styles */

const buttonPalettes = {
  primary: { background: colors.primary, pressed: colors.primaryPressed, text: colors.onPrimary, border: colors.primary },
  secondary: { background: colors.surface, pressed: colors.surfaceMuted, text: colors.primary, border: colors.border },
  danger: { background: colors.danger, pressed: '#8F1C13', text: colors.onPrimary, border: colors.danger },
  ghost: { background: 'transparent', pressed: colors.surfaceMuted, text: colors.primary, border: 'transparent' },
};

const textVariants = StyleSheet.create({
  title: { fontSize: fontSize.title, fontWeight: '800', lineHeight: 40 },
  heading: { fontSize: fontSize.heading, fontWeight: '700', lineHeight: 30 },
  body: { fontSize: fontSize.body, lineHeight: 26 },
  muted: { fontSize: fontSize.body, lineHeight: 26, color: colors.textMuted },
  small: { fontSize: fontSize.small, lineHeight: 21, color: colors.textMuted },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  // Keep content readable on tablets / web by capping the line length.
  centered: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  screenContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  text: { color: colors.text },
  centerText: { textAlign: 'center' },
  button: {
    minHeight: touchTarget,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonCompact: { minHeight: 44, paddingHorizontal: spacing.md },
  buttonText: { fontSize: fontSize.large, fontWeight: '700' },
  buttonTextCompact: { fontSize: fontSize.small + 1 },
  disabled: { opacity: 0.5 },
  field: { gap: spacing.xs },
  label: { fontSize: fontSize.body, fontWeight: '600', color: colors.text },
  hint: { fontSize: fontSize.small, color: colors.textMuted },
  input: {
    minHeight: touchTarget,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputFocused: { borderColor: colors.primary },
  inputMultiline: { minHeight: 120, paddingTop: spacing.md, textAlignVertical: 'top' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow,
  },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  noticeText: { flex: 1, fontSize: fontSize.body, lineHeight: 24, fontWeight: '600' },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
});
