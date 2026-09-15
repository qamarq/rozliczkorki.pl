import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { GoogleIcon } from "@/components/google-icon";
import { GradientButton, Input, OutlineButton, ScreenBackground } from "@/components/ui";
import { alert } from "@/lib/alert";
import { authClient } from "@/lib/auth-client";
import { savePasswordCredential } from "@/lib/credentials";
import { getGoogleIdToken } from "@/lib/google-signin";
import { colors, radius } from "@/lib/theme";

export default function LoginEmailScreen() {
  const { verified, error: verifyError } = useLocalSearchParams<{
    verified?: string;
    error?: string;
  }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) {
      alert("Błąd logowania", error.message ?? "Spróbuj ponownie");
      return;
    }
    await savePasswordCredential(email, password);
  }

  async function onGoogle() {
    setGoogleLoading(true);
    try {
      const google = await getGoogleIdToken();
      if (!google) return;
      const { error } = await authClient.signIn.social({
        provider: "google",
        idToken: google.nonce
          ? { token: google.idToken, nonce: google.nonce }
          : { token: google.idToken },
      });
      if (error) {
        alert("Błąd logowania", error.message ?? "Spróbuj ponownie");
      }
    } catch (e) {
      console.error("Google sign-in failed", e);
      alert("Błąd logowania", e instanceof Error ? e.message : "Spróbuj ponownie");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <Text style={styles.logo}>RozliczKorki</Text>
        <Text style={styles.subtitle}>
          {verifyError
            ? "Link aktywacyjny wygasł lub jest nieprawidłowy. Zaloguj się, żeby dostać nowy."
            : "Zaloguj się e-mailem i hasłem"}
        </Text>
        {verified && !verifyError ? (
          <View style={styles.verifiedPill}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.verifiedText}>Konto aktywne</Text>
          </View>
        ) : null}
        <View style={styles.headerSpacer} />

        <View style={styles.form}>
          <Input
            label="E-mail"
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Hasło"
            secureTextEntry
            textContentType="password"
            autoComplete="current-password"
            value={password}
            onChangeText={setPassword}
          />
          <GradientButton label="Zaloguj się" onPress={onSubmit} loading={loading} />
          <OutlineButton
            label="Kontynuuj przez Google"
            icon={<GoogleIcon />}
            onPress={onGoogle}
            disabled={googleLoading}
          />
        </View>

        <Link href="/forgot-password" style={styles.link}>
          Nie pamiętasz hasła?
        </Link>
        <Link href="/register" style={styles.linkTight}>
          Nie masz konta? Załóż konto
        </Link>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 8 },
  logo: { fontSize: 32, fontWeight: "800", color: colors.text, textAlign: "center" },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.successBg,
  },
  verifiedText: { fontSize: 13, fontWeight: "600", color: colors.success },
  headerSpacer: { height: 16 },
  form: { gap: 14 },
  link: { marginTop: 20, textAlign: "center", color: colors.textMuted },
  linkTight: { marginTop: 10, textAlign: "center", color: colors.textMuted },
});
