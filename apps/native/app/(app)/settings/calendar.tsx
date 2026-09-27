import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import * as WebBrowser from "expo-web-browser";
import { Linking, Platform, Share, StyleSheet, Text, View } from "react-native";
import {
  Card,
  Chip,
  GradientButton,
  OutlineButton,
  ScreenBackground,
  ScreenHeader,
  SectionLabel,
} from "@/components/ui";
import { trackOnboardingStep } from "@repo/analytics";
import { alert } from "@/lib/alert";
import { flowDeps } from "@/lib/analytics";
import { CALENDAR_VIEW_OPTIONS, useDefaultCalendarView } from "@/lib/calendar-prefs";
import { colors } from "@/lib/theme";
import { trpc } from "@/lib/trpc";
import { HeaderScrollView } from "@/components/scroll-edge-blur";

const IOS_STEPS = [
  "Dotknij „Dodaj do Kalendarza” i potwierdź „Subskrybuj”.",
  "Zajęcia pojawią się w aplikacji Kalendarz jako osobny kalendarz „RozliczKorki”.",
  "Nowe zajęcia, przesunięcia i odwołania dojdą same, zwykle w ciągu godziny.",
];

const ANDROID_STEPS = [
  "Dotknij „Dodaj do Kalendarza Google” i potwierdź „Dodaj” na stronie Google. Użyj tego samego konta Google, co w telefonie.",
  "W aplikacji Kalendarz Google otwórz Ustawienia → RozliczKorki i włącz synchronizację.",
  "Google odświeża subskrypcje co kilka godzin, więc zmiany mogą pojawić się z opóźnieniem.",
];

export default function CalendarSettingsScreen() {
  const calendarView = useDefaultCalendarView();

  return (
    <ScreenBackground header={<ScreenHeader title="Kalendarz" />}>
      <HeaderScrollView contentContainerStyle={styles.content}>
        <Card style={{ gap: 8 }}>
          <Text style={styles.prefLabel}>Domyślny widok</Text>
          <Text style={styles.prefHint}>
            Który widok pokazywać po otwarciu kalendarza.
          </Text>
          <View style={styles.chipRow}>
            {CALENDAR_VIEW_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                active={calendarView.view === opt.value}
                onPress={() => {
                  void calendarView.update(opt.value);
                  void trackOnboardingStep(flowDeps, "education_preferences_set");
                }}
              />
            ))}
          </View>
        </Card>

        <CalendarSubscription />
      </HeaderScrollView>
    </ScreenBackground>
  );
}

function CalendarSubscription() {
  const utils = trpc.useUtils();
  const { data: feed, isLoading } = trpc.calendarFeed.get.useQuery();
  const showError = (e: { message: string }) => alert("Coś poszło nie tak", e.message);

  const enable = trpc.calendarFeed.enable.useMutation({
    onSuccess: (next) => utils.calendarFeed.get.setData(undefined, next),
    onError: showError,
  });
  const regenerate = trpc.calendarFeed.regenerate.useMutation({
    onSuccess: (next) => {
      utils.calendarFeed.get.setData(undefined, next);
      alert("Nowy link gotowy", "Stary przestał działać. Dodaj kalendarz jeszcze raz.");
    },
    onError: showError,
  });
  const disable = trpc.calendarFeed.disable.useMutation({
    onSuccess: () => utils.calendarFeed.get.setData(undefined, null),
    onError: showError,
  });

  async function openLink(url: string, inBrowser: boolean) {
    try {
      if (inBrowser) await WebBrowser.openBrowserAsync(url);
      else await Linking.openURL(url);
    } catch {
      alert(
        "Nie udało się otworzyć kalendarza",
        "Użyj przycisku „Udostępnij link” i dodaj go w kalendarzu ręcznie.",
      );
    }
  }

  const steps = Platform.OS === "ios" ? IOS_STEPS : ANDROID_STEPS;

  return (
    <View>
      <SectionLabel>Subskrypcja w kalendarzu telefonu</SectionLabel>
      <Card style={{ gap: 12 }}>
        <Text style={styles.prefHint}>
          Zajęcia z RozliczKorki pojawią się w kalendarzu telefonu i będą się same
          aktualizować: nowe zajęcia, przesunięcia i odwołania.
        </Text>

        {isLoading ? null : !feed ? (
          <GradientButton
            label="Włącz subskrypcję"
            loading={enable.isPending}
            onPress={() => enable.mutate()}
          />
        ) : (
          <>
            {Platform.OS === "ios" ? (
              <>
                <GradientButton
                  label="Dodaj do Kalendarza"
                  onPress={() => openLink(feed.webcalUrl, false)}
                />
                <OutlineButton
                  label="Kalendarz Google"
                  onPress={() => openLink(feed.googleUrl, true)}
                />
              </>
            ) : (
              <GradientButton
                label="Dodaj do Kalendarza Google"
                onPress={() => openLink(feed.googleUrl, true)}
              />
            )}
            <OutlineButton
              label="Udostępnij link"
              icon={<Ionicons name="share-outline" size={16} color={colors.text} />}
              onPress={() =>
                Share.share(
                  Platform.OS === "ios" ? { url: feed.url } : { message: feed.url },
                )
              }
            />
            <Text style={styles.status}>
              {feed.lastFetchedAt
                ? `Ostatnio pobrany przez kalendarz ${formatDistanceToNow(
                    new Date(feed.lastFetchedAt),
                    { addSuffix: true, locale: pl },
                  )}.`
                : "Żaden kalendarz jeszcze go nie pobrał."}
            </Text>
          </>
        )}
      </Card>

      {feed && (
        <>
          <Card style={[styles.steps, { marginTop: 12 }]}>
            {steps.map((step, i) => (
              <View key={step} style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
            <Text style={styles.prefHint}>
              Kto ma ten link, widzi Twoje zajęcia razem z imionami, adresami i notatkami.
              Nie udostępniaj go dalej.
            </Text>
          </Card>

          <View style={styles.manage}>
            <OutlineButton
              label="Wygeneruj nowy link"
              disabled={regenerate.isPending}
              onPress={() =>
                alert(
                  "Wygenerować nowy link?",
                  "Obecny link przestanie działać. Nowy trzeba będzie dodać do kalendarza jeszcze raz.",
                  [
                    { text: "Anuluj", style: "cancel" },
                    { text: "Wygeneruj", onPress: () => regenerate.mutate() },
                  ],
                )
              }
            />
            <OutlineButton
              label="Wyłącz subskrypcję"
              tone="danger"
              disabled={disable.isPending}
              onPress={() =>
                alert(
                  "Wyłączyć subskrypcję?",
                  "Link przestanie działać, a zajęcia znikną z kalendarzy, które go subskrybują.",
                  [
                    { text: "Anuluj", style: "cancel" },
                    {
                      text: "Wyłącz",
                      style: "destructive",
                      onPress: () => disable.mutate(),
                    },
                  ],
                )
              }
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  prefLabel: { color: colors.text, fontSize: 14, fontWeight: "600" },
  prefHint: { color: colors.textFaint, fontSize: 12, lineHeight: 17 },
  status: { color: colors.textMuted, fontSize: 12, textAlign: "center" },
  steps: { gap: 12 },
  step: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceHover,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  stepText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19 },
  manage: { gap: 10, marginTop: 12 },
});
