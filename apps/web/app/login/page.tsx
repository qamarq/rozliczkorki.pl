"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
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
import { signInWithGoogle } from "@/lib/google-sign-in";

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

  async function onGoogle() {
    await signInWithGoogle({
      context: "signin",
      callbackURL: "/dashboard",
      onSuccess: () => {
        router.push("/dashboard");
        router.refresh();
      },
      onError: (message) => toast.error(message),
    });
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
                  <h1 className="text-brand-gradient text-2xl font-bold">Zaloguj się</h1>
                  <p className="text-muted-foreground text-balance">
                    Wpisz dane, żeby wejść do panelu.
                  </p>
                </div>

                <Field className="grid gap-3 sm:grid-cols-2">
                  <Button variant="outline" onClick={onGoogle} type="button">
                    <GoogleIcon data-icon="inline-start" />
                    Google
                  </Button>
                  <Button variant="outline" onClick={onPasskey} type="button">
                    <KeyRound data-icon="inline-start" />
                    Klucz dostępu
                  </Button>
                </Field>

                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card *:data-[slot=separator]:bg-border-solid">
                  lub e-mailem
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
                  />
                </Field>

                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Hasło</FieldLabel>
                    <Link
                      href="/forgot-password"
                      className="ml-auto text-sm underline-offset-2 hover:underline"
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
                  />
                </Field>

                <Field>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-brand-gradient text-white hover:opacity-90"
                  >
                    {loading ? "Logowanie…" : "Zaloguj się"}
                  </Button>
                </Field>

                <FieldDescription className="text-center">
                  Nie masz konta?{" "}
                  <Link href="/register" className="underline">
                    Załóż konto
                  </Link>
                </FieldDescription>
              </FieldGroup>
            </form>

            <AuthPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
