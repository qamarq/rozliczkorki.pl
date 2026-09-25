"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  AUTH_INPUT,
  AUTH_SECONDARY,
  AUTH_SUBMIT,
  AuthHeading,
  AuthNotice,
  AuthSwitch,
} from "@/components/auth-ui";
import { PageTransition } from "@/components/marketing/page-transition";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
    <PageTransition>
      <div className="flex flex-col gap-8">
        <AuthHeading
          title="Nie pamiętasz hasła?"
          description="Podaj adres e-mail, a wyślemy link do ustawienia nowego hasła."
        />

        {sent ? (
          <div className="flex flex-col gap-5">
            <AuthNotice>
              Jeśli konto o tym adresie istnieje, link do zmiany hasła jest już w drodze.
              Sprawdź skrzynkę, także spam.
            </AuthNotice>
            <Button variant="outline" asChild className={AUTH_SECONDARY}>
              <Link href="/login">Wróć do logowania</Link>
            </Button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mk-rise"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={AUTH_INPUT}
                />
              </Field>
              <Button type="submit" disabled={loading} className={AUTH_SUBMIT}>
                {loading ? "Wysyłanie…" : "Wyślij link"}
              </Button>
              <AuthSwitch text="Przypomniało Ci się?" href="/login" label="Zaloguj się" />
            </FieldGroup>
          </form>
        )}
      </div>
    </PageTransition>
  );
}
