import Link from "next/link";

export const metadata = {
  title: "Polityka prywatności — RozliczKorki",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-brand-gradient text-lg font-bold">
          RozliczKorki
        </Link>
        <Link href="/" className="text-muted-foreground text-sm underline">
          Wróć na stronę główną
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Polityka prywatności</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Ostatnia aktualizacja: 10 września 2026
          </p>
        </div>

        <Section title="1. Kto jest administratorem danych">
          <p>
            Administratorem danych osobowych przetwarzanych w aplikacji RozliczKorki
            (dostępnej pod adresem rozliczkorki.pl oraz jako aplikacja mobilna) jest
            twórca aplikacji RozliczKorki. W sprawach dotyczących ochrony danych możesz
            skontaktować się mailowo pod adresem podanym w ustawieniach aplikacji lub na
            stronie kontaktowej.
          </p>
        </Section>

        <Section title="2. Jakie dane zbieramy">
          <p>Aby aplikacja mogła działać, przetwarzamy:</p>
          <List
            items={[
              "Dane konta: imię, adres e-mail, hasło (zahaszowane) lub identyfikator logowania Google, oraz — jeśli włączysz logowanie kluczem dostępu — dane techniczne passkey (klucz publiczny, nie masz dostępu do klucza prywatnego, ten zostaje na Twoim urządzeniu).",
              "Dane Twoich uczniów, które sam(a) wprowadzasz: imię i nazwisko, adres, opcjonalny numer telefonu, typ zajęć i stawki godzinowe.",
              "Dane o zajęciach: terminy, czas trwania, status (zaplanowane/odbyte/odwołane), status i sposób płatności, notatki, które sam(a) dodajesz.",
              "Dane techniczne: adres IP, informacje o urządzeniu i przeglądarce, identyfikator sesji — potrzebne do zalogowania i utrzymania bezpieczeństwa konta.",
              "Token powiadomień push (jeśli włączysz powiadomienia w aplikacji mobilnej), potrzebny wyłącznie do wysyłki przypomnień o zajęciach i płatnościach.",
            ]}
          />
        </Section>

        <Section title="3. W jakim celu przetwarzamy dane">
          <List
            items={[
              "Świadczenie usługi: prowadzenie kalendarza zajęć, rozliczeń i statystyk zarobków (podstawa: wykonanie umowy — art. 6 ust. 1 lit. b RODO).",
              "Logowanie i bezpieczeństwo konta, w tym logowanie przez Google i kluczem dostępu (podstawa: wykonanie umowy oraz prawnie uzasadniony interes — art. 6 ust. 1 lit. f RODO).",
              "Wysyłka przypomnień push i e-mail o zbliżających się zajęciach lub zaległych płatnościach (podstawa: wykonanie umowy).",
              "Utrzymanie i rozwój aplikacji, w tym wykrywanie i naprawa błędów (podstawa: prawnie uzasadniony interes).",
            ]}
          />
        </Section>

        <Section title="4. Dane Twoich uczniów">
          <p>
            Dane uczniów (i ewentualnie ich rodziców/opiekunów) wprowadzasz Ty jako
            korepetytor — w tym zakresie to Ty jesteś administratorem tych danych, a
            RozliczKorki pełni rolę podmiotu przetwarzającego, który przechowuje te dane
            wyłącznie po to, żeby wyświetlić Ci je z powrotem w aplikacji. Nie
            wykorzystujemy tych danych do żadnych własnych celów (marketingu, sprzedaży,
            profilowania) i nie udostępniamy ich osobom trzecim poza dostawcami
            infrastruktury wskazanymi w punkcie 6.
          </p>
        </Section>

        <Section title="5. Okres przechowywania">
          <p>
            Dane przechowujemy przez czas posiadania aktywnego konta. Po usunięciu konta
            dane są usuwane z bazy produkcyjnej w ciągu 30 dni, z wyjątkiem sytuacji, gdy
            dłuższe przechowywanie wynika z przepisów prawa (np. rozliczeń podatkowych).
          </p>
        </Section>

        <Section title="6. Podmioty, którym powierzamy przetwarzanie danych">
          <List
            items={[
              "Dostawca hostingu aplikacji webowej (Vercel) — przechowywanie i udostępnianie aplikacji.",
              "Dostawca bazy danych (Neon, PostgreSQL) — przechowywanie danych konta, uczniów i zajęć.",
              "Google — jeśli zdecydujesz się na logowanie przez Google (weryfikacja tożsamości).",
              "Dostawca powiadomień push (Expo/Apple/Google) — wyłącznie w celu doręczenia powiadomień, jeśli je włączysz.",
            ]}
          />
        </Section>

        <Section title="7. Twoje prawa">
          <p>
            Zgodnie z RODO masz prawo do: dostępu do swoich danych, ich sprostowania,
            usunięcia, ograniczenia przetwarzania, przenoszenia danych oraz sprzeciwu
            wobec przetwarzania. Konto i wszystkie powiązane dane możesz usunąć
            samodzielnie w ustawieniach aplikacji lub kontaktując się z nami. Masz też
            prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.
          </p>
        </Section>

        <Section title="8. Bezpieczeństwo">
          <p>
            Hasła przechowujemy w postaci zahaszowanej, połączenia z aplikacją są
            szyfrowane (HTTPS/TLS), a dostęp do bazy danych jest ograniczony wyłącznie do
            infrastruktury aplikacji. Logowanie kluczem dostępu (passkey) opiera się o
            standard WebAuthn — Twój klucz prywatny nigdy nie opuszcza urządzenia.
          </p>
        </Section>

        <Section title="9. Zmiany polityki prywatności">
          <p>
            Jeśli zmienimy tę politykę, poinformujemy o tym w aplikacji lub mailowo, z
            odpowiednim wyprzedzeniem przed wejściem zmian w życie.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="text-muted-foreground flex flex-col gap-2 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
