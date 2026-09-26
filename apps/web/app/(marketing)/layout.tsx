import type { ReactNode } from "react";
import { SiteShell } from "@/components/marketing/site-shell";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
