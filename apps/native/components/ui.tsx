import { Ionicons } from "@expo/vector-icons";
import { Host, Switch as UniversalSwitch } from "@expo/ui";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Children, type ComponentProps, type ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { BlurHeader } from "@/components/scroll-edge-blur";
import { OfflineBanner } from "@/components/sync-status";
import { colors, gradients, maxWidth, radius } from "@/lib/theme";

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

export const tabScreenEdges: Edge[] = ["top"];

export function ScreenBackground({
  children,
  edges = ["top", "bottom"],
  header,
  syncStatus,
  width = "content",
}: {
  children: ReactNode;
  edges?: Edge[];
  header?: ReactNode;
  syncStatus?: boolean;
  width?: "form" | "content";
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient
        colors={gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView
        style={{ flex: 1 }}
        edges={header ? edges.filter((edge) => edge !== "top") : edges}
      >
        {syncStatus && !header && <OfflineBanner />}
        <View
          style={{
            flex: 1,
            width: "100%",
            maxWidth: maxWidth[width],
            alignSelf: "center",
          }}
        >
          {header ? (
            <BlurHeader
              header={header}
              banner={syncStatus && <OfflineBanner />}
              overTabBar={!edges.includes("bottom")}
            >
              {children}
            </BlurHeader>
          ) : (
            children
          )}
        </View>
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
  icon,
}: {
  label: string;
  onPress: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
  icon?: ReactNode;
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
      {icon}
      <Text
        style={[styles.outlineButtonText, tone === "danger" && { color: colors.danger }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Input(props: TextInputProps & { label?: string }) {
  const { label, style, secureTextEntry, ...rest } = props;
  const [revealed, setRevealed] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View>
        <TextInput
          placeholderTextColor={colors.textFaint}
          style={[styles.input, secureTextEntry && styles.inputWithToggle, style]}
          secureTextEntry={secureTextEntry && !revealed}
          {...rest}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
            style={styles.inputToggle}
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Ukryj hasło" : "Pokaż hasło"}
          >
            <Ionicons
              name={revealed ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function DateTimeField({
  label,
  mode,
  value,
  onChange,
}: {
  label: string;
  mode: "date" | "time";
  value: Date;
  onChange: (value: Date) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={[styles.input, styles.pickerField]}>
        <Text style={styles.pickerText}>
          {format(value, mode === "date" ? "EEEE, d MMMM yyyy" : "HH:mm", { locale: pl })}
        </Text>
        <Ionicons
          name={mode === "date" ? "calendar-outline" : "time-outline"}
          size={18}
          color={colors.textMuted}
        />
      </Pressable>
      {open && (
        <DateTimePicker
          value={value}
          mode={mode}
          presentation="dialog"
          is24Hour
          accentColor={colors.accentTo}
          onValueChange={(_, selected) => {
            setOpen(false);
            onChange(selected);
          }}
          onDismiss={() => setOpen(false)}
        />
      )}
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

export function ScreenHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View style={styles.screenHeader}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </Pressable>
      <Text style={styles.screenHeaderTitle} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

export function MenuGroup({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  return (
    <View style={styles.menuGroup}>
      {items.map((child, i) => (
        <View key={i} style={i > 0 && styles.menuDivider}>
          {child}
        </View>
      ))}
    </View>
  );
}

export function MenuRow({
  icon,
  label,
  description,
  onPress,
  trailing,
  tone = "default",
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  description?: string;
  onPress: () => void;
  trailing?: ReactNode;
  tone?: "default" | "danger";
}) {
  const tint = tone === "danger" ? colors.danger : "#a78bfa";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}
    >
      <View style={[styles.menuIcon, tone === "danger" && styles.menuIconDanger]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, tone === "danger" && { color: colors.danger }]}>
          {label}
        </Text>
        {description && <Text style={styles.menuDescription}>{description}</Text>}
      </View>
      {trailing === undefined ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
      ) : (
        trailing
      )}
    </Pressable>
  );
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
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
  inputWithToggle: { paddingRight: 44 },
  inputToggle: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  pickerField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerText: { fontSize: 15, color: colors.text },
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
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: { padding: 4 },
  screenHeaderTitle: { flex: 1, fontSize: 20, fontWeight: "800", color: colors.text },
  menuGroup: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  menuDivider: { borderTopWidth: 1, borderTopColor: colors.borderSubtle },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuRowPressed: { backgroundColor: colors.surfaceHover },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: "rgba(139, 92, 246, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconDanger: { backgroundColor: colors.dangerBg },
  menuLabel: { color: colors.text, fontSize: 15, fontWeight: "600" },
  menuDescription: {
    color: colors.textFaint,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
