import Link from "next/link";
import type { ReactNode } from "react";
import { MailCheck } from "lucide-react";

export const AUTH_INPUT = "bg-card h-11 rounded-[10px] px-3.5 text-[15px] md:text-[15px]";

export const AUTH_SUBMIT =
  "h-11 w-full rounded-[10px] text-[15px] font-semibold shadow-[0_10px_24px_-14px_rgb(79_70_229/0.8)] hover:bg-primary hover:brightness-110";

export const AUTH_SECONDARY = "bg-card h-10 w-full rounded-[10px] text-[15px]";

export function AuthHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mk-rise flex flex-col gap-2">
      <h1 className="font-display text-balance text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.015em]">
        {title}
      </h1>
      <p className="text-muted-foreground text-pretty">{description}</p>
    </div>
  );
}

export function AuthNotice({ children }: { children: ReactNode }) {
  return (
    <div className="bg-paid-soft text-foreground flex items-start gap-3 rounded-xl p-4 text-[15px]">
      <MailCheck className="text-success mt-0.5 size-5 shrink-0" />
      <p className="text-pretty">{children}</p>
    </div>
  );
}

export function AuthSwitch({
  text,
  href,
  label,
}: {
  text: string;
  href: string;
  label: string;
}) {
  return (
    <p className="text-muted-foreground text-[15px]">
      {text}{" "}
      <Link
        href={href}
        className="text-accent-foreground font-semibold underline-offset-4 hover:underline"
      >
        {label}
      </Link>
    </p>
  );
}

export function LegalNote() {
  return (
    <p className="text-muted-foreground text-pretty text-xs leading-relaxed">
      Zakładając konto, akceptujesz{" "}
      <Link href="/terms" className="hover:text-foreground underline underline-offset-2">
        Regulamin
      </Link>{" "}
      i{" "}
      <Link
        href="/privacy"
        className="hover:text-foreground underline underline-offset-2"
      >
        Politykę prywatności
      </Link>
      .
    </p>
  );
}
