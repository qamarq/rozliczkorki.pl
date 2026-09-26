import type { Metadata } from "next";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCProvider } from "@/lib/trpc/client";
import {
  Caveat,
  Instrument_Sans,
  JetBrains_Mono,
  Poltawski_Nowy,
} from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { cn } from "cn";
import { APP_STORE_ID, SITE_URL } from "@/lib/site";

const sans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin", "latin-ext"],
});

const display = Poltawski_Nowy({
  variable: "--font-poltawski",
  subsets: ["latin", "latin-ext"],
});

const hand = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "latin-ext"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rozlicz Korki",
    template: "%s",
  },
  description: "Prosty tracker korepetycji: kalendarz, płatności, zarobki.",
  itunes: { appId: APP_STORE_ID },
  openGraph: {
    siteName: "Rozlicz Korki",
    locale: "pl_PL",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body
        className={cn(
          sans.className,
          sans.variable,
          display.variable,
          hand.variable,
          mono.variable,
          "antialiased",
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <TooltipProvider>
            <TRPCProvider>
              <AnalyticsProvider>{children}</AnalyticsProvider>
            </TRPCProvider>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-EQDGQFNTLF" />
    </html>
  );
}
