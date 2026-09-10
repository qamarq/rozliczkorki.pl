import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Usunięcie konta — RozliczKorki",
};

const SUPPORT_EMAIL = "me@kamilmarczak.pl";

export default function DeleteAccountPage() {
  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "Prośba o usunięcie konta — RozliczKorki",
  )}&body=${encodeURIComponent(
    "Cześć,\n\nProszę o usunięcie mojego konta w RozliczKorki.\n\nAdres e-mail konta: \n\nPozdrawiam",
  )}`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="size-7" />
          <span className="text-brand-gradient text-lg font-bold">RozliczKorki</span>
        </Link>
        <Link href="/" className="text-muted-foreground text-sm underline">
          Wróć na stronę główną
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usunięcie konta i danych</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Dotyczy konta w aplikacji RozliczKorki (web i mobile).
          </p>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed">
          Aby usunąć swoje konto wraz ze wszystkimi powiązanymi danymi (profil,
          uczniowie, zajęcia, historia płatności, sesje logowania i zapisane klucze
          dostępu), napisz do nas na adres poniżej. Poproś o usunięcie konta z tego
          samego adresu e-mail, którego używasz do logowania — pozwala nam to
          zweryfikować, że to Ty składasz wniosek.
        </p>

        <Card>
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Napisz e-mail z prośbą o usunięcie konta</p>
              <p className="text-muted-foreground text-sm">{SUPPORT_EMAIL}</p>
            </div>
            <Button asChild>
              <a href={mailtoHref}>
                <Mail className="size-4" />
                Poproś o usunięcie konta
              </a>
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Co dzieje się dalej</h2>
          <ol className="text-muted-foreground list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
            <li>
              Wysyłasz wiadomość na {SUPPORT_EMAIL} z adresu e-mail powiązanego z
              kontem (albo podajesz go w treści, jeśli piszesz z innego adresu).
            </li>
            <li>Potwierdzamy tożsamość i zakres usunięcia w odpowiedzi mailowej.</li>
            <li>
              Usuwamy konto oraz wszystkie powiązane dane (profil, uczniowie, zajęcia,
              stawki, historia płatności, sesje, klucze dostępu, token powiadomień
              push) w ciągu 30 dni od potwierdzenia.
            </li>
            <li>
              Wysyłamy potwierdzenie usunięcia na Twój adres e-mail. Ta operacja jest
              nieodwracalna.
            </li>
          </ol>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Uwaga</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Jeśli korzystałeś(-aś) z RozliczKorki jako korepetytor(ka) i wprowadzałeś(-aś)
            dane swoich uczniów, usunięcie konta usuwa też te dane z naszej bazy — nie
            przechowujemy ich osobno. Więcej informacji znajdziesz w{" "}
            <Link href="/privacy" className="text-primary underline">
              Polityce prywatności
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
