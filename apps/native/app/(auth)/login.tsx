import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { GoogleIcon } from "@/components/google-icon";
import { GradientButton, Input, OutlineButton } from "@/components/ui";
import { ScreenBackground } from "@/components/ui";
import { alert } from "@/lib/alert";
import { authClient } from "@/lib/auth-client";
import { getGoogleIdToken } from "@/lib/google-signin";
import { colors } from "@/lib/theme";

export default function LoginScreen() {
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
    }
  }

  async function onGoogle() {
    setGoogleLoading(true);
    try {
      const google = await getGoogleIdToken();
      if (!google) {
        // user cancelled the account picker
        setGoogleLoading(false);
        return;
      }
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
        <Text style={styles.subtitle}>Zaloguj się do panelu</Text>

        <View style={styles.form}>
          <Input
            label="E-mail"
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="username"
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
    marginBottom: 32,
  },
  form: { gap: 14 },
  link: { marginTop: 20, textAlign: "center", color: colors.textMuted },
  linkTight: { marginTop: 10, textAlign: "center", color: colors.textMuted },
});
