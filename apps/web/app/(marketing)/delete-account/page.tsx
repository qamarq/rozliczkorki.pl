import Link from "next/link";
import { Mail } from "lucide-react";
import { LegalPage, LegalSection } from "@/components/marketing/legal";

export const metadata = {
  title: "Usunięcie konta | RozliczKorki",
};

const SUPPORT_EMAIL = "me@kamilmarczak.pl";

export default function DeleteAccountPage() {
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "Prośba o usunięcie konta | RozliczKorki",
  )}&body=${encodeURIComponent(
    "Cześć,\n\nProszę o usunięcie mojego konta w RozliczKorki.\n\nAdres e-mail konta: \n\nPozdrawiam",
  )}`;

  return (
    <LegalPage
      current="/delete-account"
      title="Usunięcie konta i danych"
      meta="Dotyczy konta w aplikacji RozliczKorki (web i mobile)."
    >
      <LegalSection title="Usuń konto samodzielnie">
        <p>
          Konto wraz ze wszystkimi powiązanymi danymi (profil, uczniowie, zajęcia,
          historia płatności, sesje logowania i zapisane klucze dostępu) usuniesz
          samodzielnie w aplikacji: zaloguj się, kliknij swoje imię w lewym dolnym rogu,
          wybierz <strong>Ustawienia</strong>, a następnie sekcję{" "}
          <strong>Usuwanie konta</strong>. Wyślemy link potwierdzający na Twój adres
          e-mail. Po kliknięciu w niego konto i dane znikają natychmiast i nieodwracalnie.
        </p>
        <p>
          Jeśli nie możesz zalogować się do aplikacji, napisz do nas na adres poniżej z
          tego samego adresu e-mail, którego używasz do logowania. Pozwala nam to
          zweryfikować, że to Ty składasz wniosek.
        </p>
      </LegalSection>

      <div className="bg-card border-border flex flex-col items-start gap-4 rounded-2xl border p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Nie masz dostępu do konta? Napisz do nas</p>
          <p className="text-muted-foreground text-sm">{SUPPORT_EMAIL}</p>
        </div>
        <a
          href={mailtoHref}
          className="bg-primary text-primary-foreground inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 font-semibold transition-[filter] hover:brightness-110"
        >
          <Mail className="size-4" />
          Poproś o usunięcie konta
        </a>
      </div>

      <LegalSection title="Co dzieje się dalej (droga mailowa)">
        <ol className="marker:text-faint list-decimal space-y-1.5 pl-5">
          <li>
            Wysyłasz wiadomość na {SUPPORT_EMAIL} z adresu e-mail powiązanego z kontem
            (albo podajesz go w treści, jeśli piszesz z innego adresu).
          </li>
          <li>Potwierdzamy tożsamość i zakres usunięcia w odpowiedzi mailowej.</li>
          <li>
            Usuwamy konto oraz wszystkie powiązane dane (profil, uczniowie, zajęcia,
            stawki, historia płatności, sesje, klucze dostępu, token powiadomień push) w
            ciągu 30 dni od potwierdzenia.
          </li>
          <li>
            Wysyłamy potwierdzenie usunięcia na Twój adres e-mail. Ta operacja jest
            nieodwracalna.
          </li>
        </ol>
      </LegalSection>

      <LegalSection title="Uwaga">
        <p>
          Jeśli korzystałeś(-aś) z RozliczKorki jako korepetytor(ka) i wprowadzałeś(-aś)
          dane swoich uczniów, usunięcie konta usuwa też te dane z naszej bazy. Nie
          przechowujemy ich osobno. Więcej informacji znajdziesz w{" "}
          <Link href="/privacy">Polityce prywatności</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
