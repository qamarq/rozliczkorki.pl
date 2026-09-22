import { Link, Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppleSignInButton } from "@/components/apple-sign-in-button";
import { GradientButton, OutlineButton, ScreenBackground } from "@/components/ui";
import { alert } from "@/lib/alert";
import { credentialManagerAvailable, signInWithSavedCredential } from "@/lib/credentials";
import { colors } from "@/lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [savedLoading, setSavedLoading] = useState(false);

  async function onSavedCredential(manual: boolean) {
    setSavedLoading(true);
    const result = await signInWithSavedCredential();
    setSavedLoading(false);
    if (result.status === "error") {
      alert("Błąd logowania", result.message);
    } else if (result.status === "unavailable" && manual) {
      alert(
        "Brak zapisanych danych",
        `Nie znaleziono zapisanych haseł ani kluczy dostępu. Zaloguj się e-mailem i hasłem.${
          __DEV__ && result.detail ? `\n\n${result.detail}` : ""
        }`,
      );
    }
  }

  useEffect(() => {
    if (credentialManagerAvailable) void onSavedCredential(false);
  }, []);

  if (!credentialManagerAvailable) return <Redirect href="/login-email" />;

  return (
    <ScreenBackground width="form">
      <View style={styles.container}>
        <Text style={styles.logo}>RozliczKorki</Text>
        <Text style={styles.subtitle}>Zaloguj się do panelu</Text>

        <View style={styles.form}>
          <GradientButton
            label="Zaloguj się zapisanymi danymi"
            onPress={() => onSavedCredential(true)}
            loading={savedLoading}
          />
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>lub</Text>
            <View style={styles.dividerLine} />
          </View>
          <OutlineButton
            label="Zaloguj się e-mailem i hasłem"
            onPress={() => router.push("/login-email")}
          />
          <AppleSignInButton />
        </View>

        <Link href="/register" style={styles.link}>
          Nie masz konta? Załóż konto
        </Link>
      </View>
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
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerLabel: { fontSize: 13, color: colors.textFaint },
  link: { marginTop: 20, textAlign: "center", color: colors.textMuted },
});
