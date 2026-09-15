import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GoogleIcon } from "@/components/google-icon";
import { GradientButton, Input, OutlineButton, ScreenBackground } from "@/components/ui";
import { alert } from "@/lib/alert";
import { authClient } from "@/lib/auth-client";
import { savePasswordCredential } from "@/lib/credentials";
import { PRIVACY_URL, TERMS_URL } from "@/lib/legal";
import {
  setPendingSignUp,
  subscribeEmailVerified,
  VERIFIED_CALLBACK,
} from "@/lib/pending-verification";
import { colors } from "@/lib/theme";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeEmailVerified(async (signUp) => {
      const { error } = await authClient.signIn.email(signUp);
      if (error) {
        router.replace(VERIFIED_CALLBACK);
        return;
      }
      setPendingSignUp(null);
    });
    return () => {
      unsubscribe();
      setPendingSignUp(null);
    };
  }, []);

  async function onSubmit() {
    setLoading(true);
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: VERIFIED_CALLBACK,
    });
    setLoading(false);
    if (error) {
      alert("Błąd rejestracji", error.message ?? "Spróbuj ponownie");
      return;
    }
    setPendingSignUp({ email, password });
    setSentTo(email);
    void savePasswordCredential(email, password);
  }

  async function onResend() {
    if (!sentTo) return;
    setResending(true);
    const { error } = await authClient.sendVerificationEmail({
      email: sentTo,
      callbackURL: VERIFIED_CALLBACK,
    });
    setResending(false);
    if (error) {
      alert("Błąd", error.message ?? "Nie udało się wysłać linku");
      return;
    }
    alert("Wysłano ponownie", `Nowy link jest w drodze na ${sentTo}.`);
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

  if (sentTo) {
    return (
      <ScreenBackground>
        <View style={styles.container}>
          <Text style={styles.logo}>Sprawdź skrzynkę</Text>
          <Text style={styles.subtitle}>
            Wysłaliśmy link aktywacyjny na {sentTo}. Otwórz go na tym telefonie, a
            zalogujemy Cię automatycznie. Nie widzisz maila? Zajrzyj do spamu.
          </Text>
          <View style={styles.form}>
            <GradientButton
              label="Przejdź do logowania"
              onPress={() => router.replace("/login")}
            />
            <OutlineButton
              label="Wyślij link ponownie"
              onPress={onResend}
              disabled={resending}
            />
          </View>
        </View>
      </ScreenBackground>
    );
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
            icon={<GoogleIcon />}
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
