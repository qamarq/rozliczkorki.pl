"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Kalendarz" },
  { href: "/dashboard/students", label: "Uczniowie" },
  { href: "/dashboard/stats", label: "Statystyki" },
];

export function DashboardNav({ userName }: { userName: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function onSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-brand-gradient text-lg font-bold">Korkomat</span>
      <nav className="flex items-center gap-1">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === link.href
                ? "bg-brand-gradient text-white"
                : "text-muted-foreground hover:bg-secondary/50",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground text-sm">{userName}</span>
        <Button variant="outline" size="sm" onClick={onSignOut}>
          Wyloguj
        </Button>
      </div>
    </header>
  );
}
