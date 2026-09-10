"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { CalendarDays, LineChart, LogOut, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Kalendarz lekcji", icon: CalendarDays },
  { href: "/dashboard/students", label: "Uczniowie i stawki", icon: Users },
  { href: "/dashboard/stats", label: "Finanse i statystyki", icon: LineChart },
  { href: "/dashboard/settings", label: "Ustawienia", icon: Settings },
];

function useSignOut() {
  const router = useRouter();
  return async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };
}

export function DashboardSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const signOut = useSignOut();

  return (
    <aside className="bg-sidebar border-sidebar-border sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r lg:flex">
      <div className="flex items-center gap-2 px-5 py-6">
        <span className="bg-primary flex size-8 items-center justify-center rounded-lg text-sm font-bold text-white">
          R
        </span>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold text-white">RozliczKorki</span>
          <span className="text-muted-foreground text-[11px] tracking-wide uppercase">
            Panel korepetytora
          </span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-sidebar-border mt-auto flex items-center justify-between gap-2 border-t px-4 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            {userName.slice(0, 2).toUpperCase()}
          </span>
          <span className="truncate text-sm font-medium">{userName}</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={signOut} title="Wyloguj">
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  );
}

export function DashboardTopbar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const signOut = useSignOut();

  return (
    <header className="bg-background/80 border-border sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-sm lg:hidden">
      <span className="text-brand-gradient text-base font-bold">RozliczKorki</span>
      <nav className="flex items-center gap-1 overflow-x-auto">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
              pathname === link.href
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <Button variant="ghost" size="icon-sm" onClick={signOut} title="Wyloguj">
        <LogOut className="size-4" />
      </Button>
      <span className="sr-only">{userName}</span>
    </header>
  );
}
