"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AUTH_INPUT,
  AUTH_SECONDARY,
  AUTH_SUBMIT,
  AuthHeading,
  AuthSwitch,
  LegalNote,
} from "@/components/auth-ui";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { PageTransition } from "@/components/marketing/page-transition";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authClient.signIn.passkey({ autoFill: true }).then(({ data }) => {
      if (data) {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        toast.error("Potwierdź najpierw adres e-mail", {
          action: {
            label: "Wyślij ponownie",
            onClick: () =>
              authClient.sendVerificationEmail({
                email,
                callbackURL: "/dashboard",
              }),
          },
        });
        return;
      }
      toast.error(error.message ?? "Nie udało się zalogować");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function onPasskey() {
    const { error } = await authClient.signIn.passkey();
    if (error) {
      toast.error(error.message ?? "Nie udało się zalogować kluczem dostępu");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        <AuthHeading
          title="Zaloguj się"
          description="Wracasz do swoich uczniów, lekcji i płatności."
        />

        <form
          onSubmit={onSubmit}
          className="mk-rise"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <FieldGroup className="gap-5">
            <div className="grid gap-2.5 sm:grid-cols-2">
              <GoogleSignInButton
                context="signin"
                callbackURL="/dashboard"
                className={AUTH_SECONDARY}
                onSuccess={() => {
                  router.push("/dashboard");
                  router.refresh();
                }}
                onError={(message) => toast.error(message)}
              />
              {/* <AppleSignInButton
                callbackURL="/dashboard"
                onError={(message) => toast.error(message)}
              /> */}
              <Button
                variant="outline"
                onClick={onPasskey}
                type="button"
                className={AUTH_SECONDARY}
              >
                <KeyRound data-icon="inline-start" />
                Klucz dostępu
              </Button>
            </div>

            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-background *:data-[slot=separator]:bg-border-solid">
              albo e-mailem
            </FieldSeparator>

            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="username webauthn"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={AUTH_INPUT}
              />
            </Field>

            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Hasło</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-muted-foreground hover:text-foreground ml-auto text-sm underline-offset-4 hover:underline"
                >
                  Nie pamiętasz hasła?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={AUTH_INPUT}
              />
            </Field>

            <Button type="submit" disabled={loading} className={AUTH_SUBMIT}>
              {loading ? "Logowanie…" : "Zaloguj się"}
            </Button>
          </FieldGroup>
        </form>

        <div
          className="mk-rise flex flex-col gap-4"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <AuthSwitch text="Nie masz konta?" href="/register" label="Załóż je za darmo" />
          <LegalNote />
        </div>
      </div>
    </PageTransition>
  );
}
