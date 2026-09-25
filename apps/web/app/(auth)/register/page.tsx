"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { nowIso } from "@repo/analytics";
import { rememberSignupMethod } from "@/components/analytics-provider";
import { acquisitionSource, browserLocale, track } from "@/lib/analytics";
import {
  AUTH_INPUT,
  AUTH_SECONDARY,
  AUTH_SUBMIT,
  AuthHeading,
  AuthNotice,
  AuthSwitch,
  LegalNote,
} from "@/components/auth-ui";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { PageTransition } from "@/components/marketing/page-transition";
import { Button } from "@/components/ui/button";
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
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    track("signup_started", {
      source: acquisitionSource(),
      locale: browserLocale(),
      timestamp: nowIso(),
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Hasła nie są takie same");
      return;
    }
    setLoading(true);
    rememberSignupMethod("email");
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

  if (sent) {
    return (
      <PageTransition>
        <div className="flex flex-col gap-7">
          <AuthHeading title="Sprawdź skrzynkę" description="Zostało jedno kliknięcie." />
          <AuthNotice>
            Wysłaliśmy link potwierdzający na <strong>{email}</strong>. Kliknij go, żeby
            aktywować konto, a zalogujemy Cię automatycznie.
          </AuthNotice>
          <Button
            variant="outline"
            type="button"
            className={AUTH_SECONDARY}
            onClick={() =>
              authClient.sendVerificationEmail({
                email,
                callbackURL: "/dashboard",
              })
            }
          >
            Wyślij link ponownie
          </Button>
          <AuthSwitch text="Masz już konto?" href="/login" label="Wróć do logowania" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        <AuthHeading
          title="Załóż konto"
          description="Za darmo i bez karty. Zajmie Ci to minutę."
        />

        <form
          onSubmit={onSubmit}
          className="mk-rise"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <FieldGroup className="gap-5">
            <GoogleSignInButton
              context="signup"
              callbackURL="/dashboard"
              label="Kontynuuj przez Google"
              className={AUTH_SECONDARY}
              onSuccess={() => {
                router.push("/dashboard");
                router.refresh();
              }}
              onError={(message) => toast.error(message)}
            />
            {/* <AppleSignInButton
              callbackURL="/dashboard"
              label="Kontynuuj przez Apple"
              onClick={() => rememberSignupMethod("apple")}
              onError={(message) => toast.error(message)}
            /> */}

            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-background *:data-[slot=separator]:bg-border-solid">
              albo e-mailem
            </FieldSeparator>

            <Field>
              <FieldLabel htmlFor="name">Imię</FieldLabel>
              <Input
                id="name"
                autoComplete="given-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={AUTH_INPUT}
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
                className={AUTH_INPUT}
              />
              <FieldDescription>
                Na ten adres wyślemy przypomnienia o lekcjach.
              </FieldDescription>
            </Field>

            <Field data-invalid={passwordsMismatch || undefined}>
              <div className="grid gap-4 sm:grid-cols-2">
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
                    className={AUTH_INPUT}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="confirm-password">Powtórz hasło</FieldLabel>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    aria-invalid={passwordsMismatch || undefined}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={AUTH_INPUT}
                  />
                </Field>
              </div>
              <FieldDescription>
                {passwordsMismatch ? "Hasła nie są takie same." : "Minimum 8 znaków."}
              </FieldDescription>
            </Field>

            <Button type="submit" disabled={loading} className={AUTH_SUBMIT}>
              {loading ? "Zakładanie…" : "Załóż konto"}
            </Button>
          </FieldGroup>
        </form>

        <div
          className="mk-rise flex flex-col gap-4"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <AuthSwitch text="Masz już konto?" href="/login" label="Zaloguj się" />
          <LegalNote />
        </div>
      </div>
    </PageTransition>
  );
}
