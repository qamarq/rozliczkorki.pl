import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GradientButton, Switch } from "@/components/ui";
import { alert } from "@/lib/alert";
import { useSession } from "@/lib/auth-client";
import {
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_CHANNEL_OPTIONS,
  type NotificationChannelKey,
  readNotificationPrefs,
  writeNotificationPrefs,
} from "@/lib/notification-prefs";
import {
  EXACT_ALARMS_PROMPTED_KEY,
  ensureNotificationChannels,
  requestNotificationPermission,
} from "@/lib/notifications";
import { colors, gradients } from "@/lib/theme";
import { canScheduleExactAlarms, openExactAlarmSettings } from "@/modules/exact-alarms";
import { canPostLiveUpdates, openLiveUpdateSettings } from "@/modules/lesson-live";

const ONBOARDING_KEY = "onboarding_complete";

const FEATURES = [
  { icon: "calendar-outline" as const, text: "Kalendarz zajęć zawsze pod ręką" },
  {
    icon: "checkmark-done-outline" as const,
    text: "Odbyte i opłacone jednym dotknięciem",
  },
  {
    icon: "trending-up-outline" as const,
    text: "Zarobki na żywo, bez liczenia w głowie",
  },
];

const CHANNEL_ICONS = {
  upcoming: "time-outline",
  overdue: "cash-outline",
  live: "pulse-outline",
} as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [requesting, setRequesting] = useState(false);
  const [channels, setChannels] = useState(DEFAULT_NOTIFICATION_PREFS.channels);
  const awaitingSettings = useRef(false);
  const anySelected = Object.values(channels).some(Boolean);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(16);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 60,
      }),
    ]).start();

    if (step === 0) {
      logoScale.setValue(0.6);
      Animated.spring(logoScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 50,
      }).start();
    }
  }, [step]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !awaitingSettings.current) return;
      awaitingSettings.current = false;
      onContinue();
    });
    return () => sub.remove();
  }, [channels]);

  async function finish() {
    await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
    router.replace(session?.user ? "/" : "/login");
  }

  function toggleChannel(key: NotificationChannelKey) {
    setChannels((current) => ({ ...current, [key]: !current[key] }));
  }

  function askToOpenSettings(title: string, message: string, open: () => void) {
    alert(title, message, [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Otwórz ustawienia",
        onPress: () => {
          awaitingSettings.current = true;
          open();
        },
      },
    ]);
  }

  async function onContinue() {
    setRequesting(true);
    try {
      const prefs = await readNotificationPrefs();
      await writeNotificationPrefs({ ...prefs, channels });
      if (!anySelected) {
        await finish();
        return;
      }

      await ensureNotificationChannels();
      if (!(await requestNotificationPermission())) {
        askToOpenSettings(
          "Zezwól na powiadomienia",
          "Bez tej zgody wybrane powiadomienia nie będą działać. Włącz je w ustawieniach aplikacji albo odznacz wszystkie rodzaje powiadomień.",
          () => Linking.openSettings(),
        );
        return;
      }

      if (!canScheduleExactAlarms()) {
        await SecureStore.setItemAsync(EXACT_ALARMS_PROMPTED_KEY, "1");
        askToOpenSettings(
          "Przypomnienia na czas",
          "Zezwól na ustawianie alarmów i przypomnień, dzięki temu powiadomienia przyjdą dokładnie o czasie.",
          () => {
            if (!openExactAlarmSettings()) Linking.openSettings();
          },
        );
        return;
      }

      if (channels.live && !canPostLiveUpdates()) {
        askToOpenSettings(
          "Zajęcia na żywo",
          "Zezwól na powiadomienia na żywo, żeby postęp zajęć był widoczny na pasku statusu i ekranie blokady.",
          () => {
            if (!openLiveUpdateSettings()) Linking.openSettings();
          },
        );
        return;
      }

      await finish();
    } finally {
      setRequesting(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
        {step === 0 && (
          <>
            <Animated.View
              style={[styles.logoBadge, { transform: [{ scale: logoScale }] }]}
            >
              <Ionicons name="checkmark-done" size={40} color="#fff" />
            </Animated.View>
            <Text style={styles.title}>Witaj w RozliczKorki</Text>
            <Text style={styles.subtitle}>
              Prosty kalendarz korepetycji, rozliczenia i zarobki, wszystko w jednym
              miejscu, bez zeszytu i karteczek.
            </Text>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.title}>Jak to działa</Text>
            <View style={{ gap: 18, marginTop: 8, width: "100%" }}>
              {FEATURES.map((f) => (
                <View key={f.text} style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <Ionicons name={f.icon} size={22} color={colors.accentTo} />
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <View style={styles.logoBadge}>
              <Ionicons name="notifications" size={36} color="#fff" />
            </View>
            <Text style={styles.title}>Powiadomienia</Text>
            <Text style={styles.subtitle}>
              Wybierz, o czym mamy Ci przypominać. Zmienisz to później w ustawieniach.
            </Text>
            <View style={{ gap: 10, marginTop: 4, width: "100%" }}>
              {NOTIFICATION_CHANNEL_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  style={styles.channelRow}
                  onPress={() => toggleChannel(opt.key)}
                >
                  <View style={styles.featureIcon}>
                    <Ionicons
                      name={CHANNEL_ICONS[opt.key]}
                      size={20}
                      color={colors.accentTo}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.channelLabel}>{opt.label}</Text>
                    <Text style={styles.channelHint}>{opt.description}</Text>
                  </View>
                  <Switch
                    value={channels[opt.key]}
                    onValueChange={() => toggleChannel(opt.key)}
                  />
                </Pressable>
              ))}
            </View>
            {anySelected && (
              <Text style={styles.permissionHint}>
                Poprosimy o zgodę na powiadomienia i dokładne alarmy. Bez nich wybrane
                powiadomienia nie zadziałają.
              </Text>
            )}
          </>
        )}
      </Animated.View>

      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        {step < 2 ? (
          <GradientButton label="Dalej" onPress={() => setStep((s) => s + 1)} />
        ) : (
          <GradientButton
            label={anySelected ? "Włącz wybrane" : "Dalej bez powiadomień"}
            onPress={onContinue}
            loading={requesting}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 14,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: colors.accentTo,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: colors.accentTo,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { fontSize: 15, fontWeight: "600", color: colors.text, flex: 1 },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  channelLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  channelHint: { fontSize: 12, color: colors.textFaint, lineHeight: 16 },
  permissionHint: {
    fontSize: 12,
    color: colors.textFaint,
    textAlign: "center",
    lineHeight: 17,
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.accentTo, width: 20 },
  footer: { paddingHorizontal: 24, paddingBottom: 32, gap: 10 },
});
