import Link from "next/link";
import { Logo } from "@/components/logo";
import { PanelLink } from "@/components/marketing/panel-link";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/lib/auth-server";

export async function MarketingHeader() {
  const session = await getServerSession();

  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-2">
        <Logo />
        <span className="text-lg font-bold tracking-tight">RozliczKorki</span>
      </Link>
      <nav className="flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" className="hidden sm:inline-flex" asChild>
          <Link href="/#funkcje">Funkcje</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/blog">Blog</Link>
        </Button>
        {session ? (
          <Button asChild>
            <PanelLink href="/dashboard">Panel</PanelLink>
          </Button>
        ) : (
          <>
            <Button variant="ghost" className="hidden sm:inline-flex" asChild>
              <Link href="/login">Zaloguj się</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Załóż konto</Link>
            </Button>
          </>
        )}
      </nav>
    </header>
  );
}
