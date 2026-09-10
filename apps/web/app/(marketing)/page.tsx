import Link from "next/link";
import { Bell, CheckCircle2, Clock3, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "@/lib/auth-server";

const FEATURES = [
  {
    icon: Clock3,
    title: "Kalendarz zajęć",
    description: "Wpisujesz korki jak w kalendarzu i widzisz cały tydzień na raz.",
  },
  {
    icon: CheckCircle2,
    title: "Odbyło się / opłacone",
    description:
      "Jednym kliknięciem oznaczasz, czy zajęcia się odbyły i czy dostałaś zapłatę — gotówką czy przelewem.",
  },
  {
    icon: TrendingUp,
    title: "Zarobki na żywo",
    description:
      "Widzisz, ile teoretycznie zarobiłaś, ile już masz na koncie, a ile jeszcze czeka na zapłatę.",
  },
  {
    icon: Bell,
    title: "Uczniowie i stawki",
    description:
      "Lista uczniów z adresem, typem zajęć i historią stawek — nawet jeśli podniesiesz cenę w trakcie roku.",
  },
];

export default async function MarketingPage() {
  const session = await getServerSession();

  return (
    <div className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="bg-primary absolute -top-40 left-1/2 h-96 w-[36rem] -translate-x-1/2 rounded-full opacity-20 blur-[120px]" />
        <div className="bg-primary absolute top-1/3 -right-24 size-80 rounded-full opacity-10 blur-[110px]" />
        <div className="bg-primary absolute bottom-0 -left-20 size-72 rounded-full opacity-10 blur-[100px]" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col gap-24 px-6 py-16">
        <header className="flex items-center justify-between">
          <span className="text-brand-gradient text-lg font-bold">RozliczKorki</span>
          <nav className="flex items-center gap-3">
            {session ? (
              <Button asChild>
                <Link href="/dashboard">Panel</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Zaloguj się</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Załóż konto</Link>
                </Button>
              </>
            )}
          </nav>
        </header>

        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-6">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              Zero skomplikowanych tabelek
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Korki pod pełną <span className="text-brand-gradient">kontrolą</span>.
            </h1>
            <p className="text-muted-foreground max-w-md text-lg text-pretty">
              Prosty kalendarz, odznaczanie lekcji i automatyczne finanse — bez
              zapisków w zeszycie i zastanawiania się, kto już zapłacił.
            </p>
            <Button size="lg" asChild>
              <Link href={session ? "/dashboard" : "/register"}>
                {session ? "Przejdź do panelu" : "Zacznij za darmo"}
              </Link>
            </Button>
          </div>

          <Card className="border-border-solid gap-0 overflow-hidden py-0 shadow-2xl">
            <div className="border-border-solid flex items-center gap-1.5 border-b px-4 py-3">
              <span className="size-2.5 rounded-full bg-red-400/70" />
              <span className="size-2.5 rounded-full bg-amber-400/70" />
              <span className="size-2.5 rounded-full bg-emerald-400/70" />
              <span className="text-muted-foreground ml-2 text-xs">RozliczKorki</span>
            </div>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Zarobiono w tym m-cu</p>
                  <p className="text-success text-xl font-semibold tabular-nums">
                    3 850 zł
                  </p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Oczekujące płatności</p>
                  <p className="text-warning text-xl font-semibold tabular-nums">
                    480 zł
                  </p>
                </div>
              </div>
              <div className="border-success bg-success/10 flex items-center justify-between rounded-lg border-l-2 px-3 py-2 text-sm">
                <span>
                  16:00–17:00 <span className="font-medium">Jan Kowalski</span>
                </span>
                <Badge className="bg-success/15 text-success border-success/30">
                  Odbyta
                </Badge>
              </div>
              <div className="border-warning bg-warning/10 flex items-center justify-between rounded-lg border-l-2 px-3 py-2 text-sm">
                <span>
                  17:30–18:30 <span className="font-medium">Zofia Nowak</span>
                </span>
                <Badge className="bg-warning/15 text-warning border-warning/30">
                  Do zapłaty
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="border-border-solid bg-card/60 hover:border-primary/50 backdrop-blur-sm transition-colors"
            >
              <CardHeader className="gap-3">
                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                  <feature.icon className="size-4.5" />
                </span>
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
