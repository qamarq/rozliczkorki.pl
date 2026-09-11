"use client";

import Link from "next/link";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthPanel } from "@/components/auth-panel";
import { GoogleIcon } from "@/components/google-icon";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Hasła nie są takie same");
      return;
    }
    setLoading(true);
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/dashboard",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Nie udało się założyć konta");
      return;
    }
    setSent(true);
  }

  async function onGoogle() {
    await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }

  return (
    <div className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="bg-primary absolute -top-32 left-1/4 size-[28rem] rounded-full opacity-25 blur-[110px]" />
        <div className="bg-success absolute -right-24 bottom-0 size-96 rounded-full opacity-20 blur-[110px]" />
      </div>

      <div className="flex w-full max-w-sm flex-col gap-6 md:max-w-4xl">
        <Card className="border-border/60 bg-card/80 overflow-hidden p-0 backdrop-blur-sm">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form onSubmit={onSubmit} className="p-6 md:p-8">
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <Logo className="mb-1 size-9 md:hidden" />
                  <h1 className="text-brand-gradient text-2xl font-bold">
                    {sent ? "Sprawdź skrzynkę" : "Załóż konto"}
                  </h1>
                  <p className="text-muted-foreground text-balance text-sm">
                    {sent ? "Zostało jedno kliknięcie." : "Za darmo, zajmie minutę."}
                  </p>
                </div>

                {sent ? (
                  <>
                    <div className="border-success bg-success/10 flex items-start gap-3 rounded-lg border-l-2 p-4 text-sm">
                      <MailCheck className="text-success mt-0.5 size-4 shrink-0" />
                      <p className="text-balance">
                        Wysłaliśmy link potwierdzający na <strong>{email}</strong>.
                        Kliknij go, żeby aktywować konto — zalogujemy Cię automatycznie.
                      </p>
                    </div>
                    <Field>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() =>
                          authClient.sendVerificationEmail({
                            email,
                            callbackURL: "/dashboard",
                          })
                        }
                      >
                        Wyślij link ponownie
                      </Button>
                    </Field>
                    <FieldDescription className="text-center">
                      <Link href="/login" className="underline">
                        Wróć do logowania
                      </Link>
                    </FieldDescription>
                  </>
                ) : (
                  <>
                    <Field>
                      <Button variant="outline" onClick={onGoogle} type="button">
                        <GoogleIcon data-icon="inline-start" />
                        Kontynuuj przez Google
                      </Button>
                    </Field>

                    <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card *:data-[slot=separator]:bg-border-solid">
                      lub e-mailem
                    </FieldSeparator>

                    <Field>
                      <FieldLabel htmlFor="name">Imię</FieldLabel>
                      <Input
                        id="name"
                        autoComplete="given-name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </Field>

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
                      <FieldDescription>
                        Na ten adres wyślemy przypomnienia o lekcjach.
                      </FieldDescription>
                    </Field>

                    <Field data-invalid={passwordsMismatch || undefined}>
                      <Field className="grid gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor="password">Hasło</FieldLabel>
                          <Input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="confirm-password">
                            Powtórz hasło
                          </FieldLabel>
                          <Input
                            id="confirm-password"
                            type="password"
                            autoComplete="new-password"
                            required
                            minLength={8}
                            aria-invalid={passwordsMismatch || undefined}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </Field>
                      </Field>
                      <FieldDescription>
                        {passwordsMismatch
                          ? "Hasła nie są takie same."
                          : "Minimum 8 znaków."}
                      </FieldDescription>
                    </Field>

                    <Field>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-brand-gradient text-white hover:opacity-90"
                      >
                        {loading ? "Zakładanie…" : "Załóż konto"}
                      </Button>
                    </Field>

                    <FieldDescription className="text-center">
                      Masz już konto?{" "}
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

        <FieldDescription className="px-6 text-center">
          Zakładając konto, akceptujesz{" "}
          <Link href="/terms" className="underline">
            Regulamin
          </Link>{" "}
          i{" "}
          <Link href="/privacy" className="underline">
            Politykę prywatności
          </Link>
          .
        </FieldDescription>
      </div>
    </div>
  );
}
