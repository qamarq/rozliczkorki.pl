import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "@/lib/auth-server";

const FEATURES = [
  {
    title: "Kalendarz zajęć",
    description: "Wpisujesz korki jak w kalendarzu i widzisz cały tydzień na raz.",
  },
  {
    title: "Odbyło się / opłacone",
    description:
      "Jednym kliknięciem oznaczasz, czy zajęcia się odbyły i czy dostałaś zapłatę — gotówką czy przelewem.",
  },
  {
    title: "Zarobki na żywo",
    description:
      "Widzisz, ile teoretycznie zarobiłaś, ile już masz na koncie, a ile jeszcze czeka na zapłatę.",
  },
  {
    title: "Uczniowie i stawki",
    description:
      "Lista uczniów z adresem, typem zajęć i historią stawek — nawet jeśli podniesiesz cenę w trakcie roku.",
  },
  {
    title: "Zajęcia cykliczne",
    description:
      "Ustawiasz zajęcia raz w tygodniu i kalendarz sam się uzupełnia na kolejne tygodnie.",
  },
  {
    title: "Korki czy szkółka",
    description: "Rozróżniasz prywatne korki od zajęć prowadzonych w szkółce.",
  },
];

export default async function MarketingPage() {
  const session = await getServerSession();

  return (
    <div className="relative overflow-hidden">
      <div className="bg-brand-gradient pointer-events-none absolute -top-40 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full opacity-25 blur-[120px]" />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-24 px-6 py-16">
        <header className="flex items-center justify-between">
          <span className="text-brand-gradient text-lg font-bold">Korkomat</span>
          <nav className="flex items-center gap-3">
            {session ? (
              <Button className="bg-brand-gradient text-white hover:opacity-90" asChild>
                <Link href="/dashboard">Panel</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Zaloguj się</Link>
                </Button>
                <Button className="bg-brand-gradient text-white hover:opacity-90" asChild>
                  <Link href="/register">Załóż konto</Link>
                </Button>
              </>
            )}
          </nav>
        </header>

        <section className="flex flex-col items-center gap-6 text-center">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Prosty tracker <span className="text-brand-gradient">korepetycji</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            Kalendarz zajęć, status płatności i podgląd zarobków — bez arkuszy i
            karteczek.
          </p>
          <Button
            size="lg"
            className="bg-brand-gradient text-white hover:opacity-90"
            asChild
          >
            <Link href={session ? "/dashboard" : "/register"}>
              {session ? "Przejdź do panelu" : "Zacznij za darmo"}
            </Link>
          </Button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="border-border/60 bg-card/60 hover:border-primary/50 backdrop-blur-sm transition-colors"
            >
              <CardHeader>
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {feature.description}
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
