import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInAppUpdate } from "@/lib/use-in-app-update";
import { colors, gradients, radius } from "@/lib/theme";

function formatMb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function ProgressBar({ progress }: { progress: number }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.fill,
          {
            width: width.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          },
        ]}
      >
        <LinearGradient
          colors={gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

export function UpdateBanner() {
  const { state, download, install, dismiss, retry } = useInAppUpdate();
  const insets = useSafeAreaInsets();
  const enter = useRef(new Animated.Value(0)).current;
  const visible = state.kind !== "none";

  useEffect(() => {
    Animated.spring(enter, {
      toValue: visible ? 1 : 0,
      useNativeDriver: true,
      friction: 9,
      tension: 60,
    }).start();
  }, [visible]);

  if (Platform.OS !== "android" || !visible) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingBottom: insets.bottom + 12 },
        {
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
            },
          ],
        },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBadge}>
            <Ionicons
              name={
                state.kind === "failed"
                  ? "alert-circle-outline"
                  : state.kind === "downloaded"
                    ? "checkmark-circle-outline"
                    : "cloud-download-outline"
              }
              size={20}
              color={state.kind === "failed" ? colors.danger : colors.accentTo}
            />
          </View>

          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.title}>
              {state.kind === "available" && "Dostępna aktualizacja"}
              {state.kind === "downloading" && "Pobieranie aktualizacji"}
              {state.kind === "downloaded" && "Aktualizacja gotowa"}
              {state.kind === "installing" && "Instalowanie"}
              {state.kind === "failed" && "Nie udało się pobrać"}
            </Text>
            <Text style={styles.hint}>
              {state.kind === "available" &&
                (state.storeVersion
                  ? `Wersja ${state.storeVersion} czeka w Google Play.`
                  : "Nowa wersja czeka w Google Play.")}
              {state.kind === "downloading" &&
                (state.total > 0
                  ? `${formatMb(state.downloaded)} z ${formatMb(state.total)}`
                  : "Przygotowywanie pobierania…")}
              {state.kind === "downloaded" &&
                "Zainstaluj teraz, aplikacja uruchomi się ponownie."}
              {state.kind === "installing" && "Za chwilę wszystko będzie gotowe."}
              {state.kind === "failed" && "Sprawdź połączenie i spróbuj ponownie."}
            </Text>
          </View>

          {(state.kind === "available" || state.kind === "failed") && (
            <Pressable
              onPress={dismiss}
              hitSlop={10}
              accessibilityLabel="Zamknij powiadomienie o aktualizacji"
            >
              <Ionicons name="close" size={18} color={colors.textFaint} />
            </Pressable>
          )}
        </View>

        {state.kind === "downloading" && (
          <View style={{ gap: 6 }}>
            <ProgressBar progress={state.progress} />
            <Text style={styles.percent}>{Math.round(state.progress * 100)}%</Text>
          </View>
        )}

        {state.kind === "available" && (
          <Pressable onPress={download} style={styles.actionWrap}>
            <LinearGradient
              colors={gradients.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.action}
            >
              <Text style={styles.actionText}>Pobierz</Text>
            </LinearGradient>
          </Pressable>
        )}

        {state.kind === "downloaded" && (
          <Pressable onPress={install} style={styles.actionWrap}>
            <LinearGradient
              colors={gradients.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.action}
            >
              <Text style={styles.actionText}>Zainstaluj</Text>
            </LinearGradient>
          </Pressable>
        )}

        {state.kind === "failed" && (
          <Pressable onPress={retry} style={styles.retry}>
            <Text style={styles.retryText}>Spróbuj ponownie</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  card: {
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "700", color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  track: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHover,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: radius.full, overflow: "hidden" },
  percent: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textFaint,
    textAlign: "right",
  },
  actionWrap: { borderRadius: radius.md, overflow: "hidden" },
  action: { paddingVertical: 11, alignItems: "center", borderRadius: radius.md },
  actionText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  retry: {
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryText: { color: colors.text, fontSize: 14, fontWeight: "600" },
});
