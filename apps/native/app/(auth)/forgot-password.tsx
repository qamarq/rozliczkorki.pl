import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { GradientButton, Input, OutlineButton, ScreenBackground } from "@/components/ui";
import { alert } from "@/lib/alert";
import { authClient } from "@/lib/auth-client";
import { WEB_URL } from "@/lib/legal";
import { colors } from "@/lib/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit() {
    if (!email.trim()) {
      alert("Podaj adres e-mail");
      return;
    }
    setLoading(true);
    const { error } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `${WEB_URL}/reset-password`,
    });
    setLoading(false);
    if (error) {
      alert("Błąd", error.message ?? "Nie udało się wysłać linku");
      return;
    }
    setSent(true);
  }

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <Text style={styles.logo}>Nie pamiętasz hasła?</Text>
        <Text style={styles.subtitle}>
          {sent
            ? "Jeśli konto o tym adresie istnieje, link do zmiany hasła jest już w drodze. Sprawdź skrzynkę, także spam."
            : "Podaj adres e-mail, a wyślemy link do ustawienia nowego hasła."}
        </Text>

        {sent ? (
          <View style={styles.form}>
            <GradientButton label="Wróć do logowania" onPress={() => router.back()} />
          </View>
        ) : (
          <View style={styles.form}>
            <Input
              label="E-mail"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <GradientButton label="Wyślij link" onPress={onSubmit} loading={loading} />
            <OutlineButton label="Anuluj" onPress={() => router.back()} />
          </View>
        )}

        <Link href="/login" style={styles.link}>
          Przypomniało Ci się? Zaloguj się
        </Link>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 8 },
  logo: { fontSize: 28, fontWeight: "800", color: colors.text, textAlign: "center" },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 32,
  },
  form: { gap: 14 },
  link: { marginTop: 20, textAlign: "center", color: colors.textMuted },
});
