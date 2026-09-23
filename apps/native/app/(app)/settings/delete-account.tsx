import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Card, OutlineButton, ScreenBackground, ScreenHeader } from "@/components/ui";
import { alert } from "@/lib/alert";
import { authClient } from "@/lib/auth-client";
import { WEB_URL } from "@/lib/legal";
import { colors } from "@/lib/theme";
import { HeaderScrollView } from "@/components/scroll-edge-blur";

export default function DeleteAccountScreen() {
  const [deleting, setDeleting] = useState(false);

  function onDeleteAccount() {
    alert(
      "Usunąć konto?",
      "Wyślemy link potwierdzający na Twój adres e-mail. Po kliknięciu w niego konto i wszystkie dane (uczniowie, zajęcia, stawki) znikną bezpowrotnie.",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Wyślij link",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const { error } = await authClient.deleteUser({
              callbackURL: `${WEB_URL}/`,
            });
            setDeleting(false);
            if (error) {
              alert("Błąd", error.message ?? "Nie udało się rozpocząć usuwania konta");
              return;
            }
            alert(
              "Sprawdź skrzynkę",
              "Wysłaliśmy link potwierdzający usunięcie konta na Twój adres e-mail.",
            );
          },
        },
      ],
    );
  }

  return (
    <ScreenBackground header={<ScreenHeader title="Usuwanie konta" />}>
      <HeaderScrollView contentContainerStyle={styles.content}>
        <Card style={{ gap: 12 }}>
          <Text style={styles.hint}>
            Konto i wszystkie dane znikają bezpowrotnie. Dla bezpieczeństwa potwierdzasz
            to linkiem, który wyślemy na Twój e-mail.
          </Text>
          <OutlineButton
            label={deleting ? "Wysyłanie…" : "Usuń konto"}
            tone="danger"
            onPress={onDeleteAccount}
            disabled={deleting}
          />
        </Card>
      </HeaderScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  hint: { color: colors.textFaint, fontSize: 13, lineHeight: 18 },
});
