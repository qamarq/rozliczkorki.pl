import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { GradientButton, OutlineButton } from "@/components/ui";
import { useSession } from "@/lib/auth-client";
import {
  ensureNotificationChannels,
  requestNotificationPermission,
} from "@/lib/notifications";
import { colors, gradients } from "@/lib/theme";

const ONBOARDING_KEY = "onboarding_complete";

const FEATURES = [
  { icon: "calendar-outline" as const, text: "Kalendarz zajęć zawsze pod ręką" },
  {
    icon: "checkmark-done-outline" as const,
    text: "Odbyte i opłacone — jednym dotknięciem",
  },
  {
    icon: "trending-up-outline" as const,
    text: "Zarobki na żywo, bez liczenia w głowie",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [requesting, setRequesting] = useState(false);

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

  async function finish() {
    await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
    router.replace(session?.user ? "/" : "/login");
  }

  async function onEnableNotifications() {
    setRequesting(true);
    try {
      await ensureNotificationChannels();
      await requestNotificationPermission();
    } finally {
      setRequesting(false);
      finish();
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
              Prosty kalendarz korepetycji, rozliczenia i zarobki — wszystko w jednym
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
            <Text style={styles.title}>Włącz powiadomienia</Text>
            <Text style={styles.subtitle}>
              Przypomnimy Ci godzinę przed zajęciami i dopilnujemy zaległych płatności.
              Możesz to później zmienić w ustawieniach telefonu — mamy dwie osobne
              kategorie:
            </Text>
            <View style={{ gap: 12, marginTop: 4, width: "100%" }}>
              <View style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name="time-outline" size={20} color={colors.accentTo} />
                </View>
                <Text style={styles.featureText}>Nadchodzące zajęcia</Text>
              </View>
              <View style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name="cash-outline" size={20} color={colors.accentTo} />
                </View>
                <Text style={styles.featureText}>Zaległe płatności</Text>
              </View>
            </View>
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
          <>
            <GradientButton
              label="Włącz powiadomienia"
              onPress={onEnableNotifications}
              loading={requesting}
            />
            <OutlineButton label="Może później" onPress={finish} disabled={requesting} />
          </>
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
    paddingHorizontal: 32,
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
