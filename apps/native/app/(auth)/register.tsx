import { Link } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GradientButton, Input, OutlineButton, ScreenBackground } from "@/components/ui";
import { alert } from "@/lib/alert";
import { authClient } from "@/lib/auth-client";
import { PRIVACY_URL, TERMS_URL } from "@/lib/legal";
import { colors } from "@/lib/theme";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    const { error } = await authClient.signUp.email({ name, email, password });
    setLoading(false);
    if (error) {
      alert("Błąd rejestracji", error.message ?? "Spróbuj ponownie");
    }
  }

  async function onGoogle() {
    setGoogleLoading(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "rozliczkorki://",
    });
    setGoogleLoading(false);
    if (error) {
      alert("Błąd logowania", error.message ?? "Spróbuj ponownie");
    }
  }

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <Text style={styles.logo}>Załóż konto</Text>
        <Text style={styles.subtitle}>Za darmo, zajmie minutę</Text>

        <View style={styles.form}>
          <Input
            label="Imię"
            textContentType="name"
            value={name}
            onChangeText={setName}
          />
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
            textContentType="newPassword"
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
          />
          <GradientButton label="Załóż konto" onPress={onSubmit} loading={loading} />
          <OutlineButton
            label="Kontynuuj przez Google"
            onPress={onGoogle}
            disabled={googleLoading}
          />
        </View>

        <Link href="/login" style={styles.link}>
          Masz już konto? Zaloguj się
        </Link>
        <Text style={styles.legal}>
          Zakładając konto, akceptujesz{" "}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>
            Regulamin
          </Text>{" "}
          i{" "}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_URL)}>
            Politykę prywatności
          </Text>
          .
        </Text>
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
  legal: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 12,
    color: colors.textFaint,
  },
  legalLink: { textDecorationLine: "underline" },
});
