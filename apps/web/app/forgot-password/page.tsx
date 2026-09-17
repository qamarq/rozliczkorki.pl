"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthPanel } from "@/components/auth-panel";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Nie udało się wysłać linku");
      return;
    }
    setSent(true);
  }

  return (
    <div className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="bg-primary absolute -top-32 left-1/4 size-[28rem] rounded-full opacity-25 blur-[110px]" />
        <div className="bg-success absolute bottom-0 right-[-6rem] size-96 rounded-full opacity-20 blur-[110px]" />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-6 md:max-w-4xl">
        <Card className="border-border/60 bg-card/80 overflow-hidden p-0 backdrop-blur-sm">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form onSubmit={onSubmit} className="p-6 md:p-8">
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <Logo className="mb-1 size-9 md:hidden" />
                  <h1 className="text-brand-gradient text-2xl font-bold">
                    Nie pamiętasz hasła?
                  </h1>
                  <p className="text-muted-foreground text-balance">
                    Podaj adres e-mail, a wyślemy link do ustawienia nowego hasła.
                  </p>
                </div>

                {sent ? (
                  <>
                    <div className="border-success bg-success/10 flex items-start gap-3 rounded-lg border-l-2 p-4 text-sm">
                      <MailCheck className="text-success mt-0.5 size-4 shrink-0" />
                      <p className="text-balance">
                        Jeśli konto o tym adresie istnieje, link do zmiany hasła jest już
                        w drodze. Sprawdź skrzynkę, także spam.
                      </p>
                    </div>
                    <Field>
                      <Button variant="outline" type="button" asChild>
                        <Link href="/login">Wróć do logowania</Link>
                      </Button>
                    </Field>
                  </>
                ) : (
                  <>
                    <Field>
                      <FieldLabel htmlFor="email">E-mail</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Field>

                    <Field>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-brand-gradient text-white hover:opacity-90"
                      >
                        {loading ? "Wysyłanie…" : "Wyślij link"}
                      </Button>
                    </Field>

                    <FieldDescription className="text-center">
                      Przypomniało Ci się?{" "}
                      <Link href="/login" className="underline">
                        Zaloguj się
                      </Link>
                    </FieldDescription>
                  </>
                )}
              </FieldGroup>
            </form>

            <AuthPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
