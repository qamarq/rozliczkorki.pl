import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCProvider } from "@/lib/trpc/client";
import { Inter, JetBrains_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { cn } from "cn";
import { SITE_URL } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin", "latin-ext"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RozliczKorki",
    template: "%s",
  },
  description: "Prosty tracker korepetycji — kalendarz, płatności, zarobki.",
  openGraph: {
    siteName: "RozliczKorki",
    locale: "pl_PL",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={cn(inter.className, mono.variable, "antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <TooltipProvider>
            <TRPCProvider>{children}</TRPCProvider>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId="G-EQDGQFNTLF" />
    </html>
  );
}
