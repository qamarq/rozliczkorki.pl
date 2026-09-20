"use client";

import { useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { GooglePlayIcon } from "@/components/store-icons";
import { Button } from "@/components/ui/button";
import { GOOGLE_PLAY_URL } from "@/lib/site";

const DISMISSED_KEY = "android-banner-dismissed";

const listeners = new Set<() => void>();
let dismissed = false;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function shouldShow() {
  if (dismissed || !/Android/i.test(navigator.userAgent)) return false;
  try {
    return !localStorage.getItem(DISMISSED_KEY);
  } catch {
    return true;
  }
}

function dismiss() {
  dismissed = true;
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Blocked storage only means the banner comes back on the next visit.
  }
  for (const listener of listeners) listener();
}

export function AndroidAppBanner() {
  const visible = useSyncExternalStore(subscribe, shouldShow, () => false);
  if (!visible) return null;

  return (
    <div className="border-border-solid bg-card/80 mb-4 flex items-center gap-3 rounded-xl border p-3 backdrop-blur md:hidden">
      <GooglePlayIcon className="size-7 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <p className="text-sm font-semibold">Masz Androida?</p>
        <p className="text-muted-foreground text-xs">
          Aplikacja przypomni o zajęciach pushem.
        </p>
      </div>
      <Button size="sm" asChild>
        <a href={GOOGLE_PLAY_URL} target="_blank" rel="noreferrer">
          Pobierz
        </a>
      </Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Zamknij"
        className="text-muted-foreground hover:text-foreground -mr-1 shrink-0 p-1"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
