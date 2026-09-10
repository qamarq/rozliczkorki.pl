import { Host, Switch as UniversalSwitch } from "@expo/ui";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors, gradients, radius } from "@/lib/theme";

export function Switch({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Host matchContents colorScheme="dark" seedColor={colors.accentTo}>
      <UniversalSwitch value={value} onValueChange={onValueChange} disabled={disabled} />
    </Host>
  );
}

export function ScreenBackground({
  children,
  edges = ["top", "bottom"],
}: {
  children: ReactNode;
  edges?: Edge[];
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient
        colors={gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function GradientButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={styles.gradientWrap}
    >
      <LinearGradient
        colors={gradients.accent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientButton, (disabled || loading) && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.gradientButtonText}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function OutlineButton({
  label,
  onPress,
  tone = "default",
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.outlineButton,
        tone === "danger" && { borderColor: colors.danger },
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[styles.outlineButtonText, tone === "danger" && { color: colors.danger }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Input(props: TextInputProps & { label?: string }) {
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  if (active) {
    return (
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chip}
        >
          <Text style={styles.chipTextActive}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={[styles.chip, styles.chipInactive]}>
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

export function Badge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneStyles = {
    default: { bg: colors.surfaceHover, fg: colors.textMuted },
    success: { bg: colors.successBg, fg: colors.success },
    warning: { bg: colors.warningBg, fg: colors.warning },
    danger: { bg: colors.dangerBg, fg: colors.danger },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: toneStyles.bg }]}>
      <Text style={[styles.badgeText, { color: toneStyles.fg }]}>{label}</Text>
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  gradientWrap: { borderRadius: radius.md, overflow: "hidden" },
  gradientButton: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  gradientButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  outlineButtonText: { color: colors.text, fontWeight: "600", fontSize: 15 },
  disabled: { opacity: 0.5 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    padding: 12,
    fontSize: 15,
    color: colors.text,
  },
  chip: {
    borderRadius: radius.full,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  chipInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.textMuted, fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: "#fff", fontWeight: "700", fontSize: 13 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.full },
  badgeText: { fontSize: 11, fontWeight: "700" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textFaint,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
});
