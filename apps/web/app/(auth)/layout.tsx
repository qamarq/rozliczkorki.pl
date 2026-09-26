import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";
import { Logo } from "@/components/logo";
import { SiteShell } from "@/components/marketing/site-shell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <SiteShell className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex min-h-svh flex-col px-5 py-5 sm:px-10 sm:py-7">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight"
          >
            <Logo className="size-8" />
            RozliczKorki
          </Link>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground group flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            Strona główna
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>
      </div>
      <AuthPanel />
    </SiteShell>
  );
}
