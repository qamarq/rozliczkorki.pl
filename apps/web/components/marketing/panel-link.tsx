"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ANDROID_PACKAGE } from "@/lib/site";

function androidIntentUrl(href: string) {
  const target = new URL(href, window.location.origin);
  const fallback = encodeURIComponent(target.href);
  return `intent://${target.host}${target.pathname}${target.search}#Intent;scheme=${target.protocol.replace(":", "")};package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`;
}

export function PanelLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  function handleNavigate(event: { preventDefault: () => void }) {
    if (!href.startsWith("/dashboard") || !/Android/i.test(navigator.userAgent)) return;

    event.preventDefault();
    window.location.href = androidIntentUrl(href);
  }

  return (
    <Link href={href} className={className} onNavigate={handleNavigate}>
      {children}
    </Link>
  );
}
