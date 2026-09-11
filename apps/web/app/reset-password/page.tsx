"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { AuthPanel } from "@/components/auth-panel";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const invalidLink = !token || !!linkError;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password !== confirmPassword) {
      toast.error("Hasła nie są takie same");
      return;
    }
    setLoading(true);
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Nie udało się zmienić hasła");
      return;
    }
    toast.success("Hasło zmienione. Zaloguj się nowym hasłem.");
    router.push("/login");
  }

  return (
    <form onSubmit={onSubmit} className="p-6 md:p-8">
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo className="mb-1 size-9 md:hidden" />
          <h1 className="text-brand-gradient text-2xl font-bold">Ustaw nowe hasło</h1>
          <p className="text-muted-foreground text-balance">
            {invalidLink
              ? "Ten link wygasł albo został już użyty."
              : "Wpisz nowe hasło do swojego konta."}
          </p>
        </div>

        {invalidLink ? (
          <Field>
            <Button
              type="button"
              asChild
              className="bg-brand-gradient text-white hover:opacity-90"
            >
              <Link href="/forgot-password">Poproś o nowy link</Link>
            </Button>
          </Field>
        ) : (
          <>
            <Field data-invalid={passwordsMismatch || undefined}>
              <FieldLabel htmlFor="password">Nowe hasło</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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
              />
              <FieldDescription>
                {passwordsMismatch ? "Hasła nie są takie same." : "Minimum 8 znaków."}
              </FieldDescription>
            </Field>

            <Field>
              <Button
                type="submit"
                disabled={loading}
                className="bg-brand-gradient text-white hover:opacity-90"
              >
                {loading ? "Zapisywanie…" : "Zmień hasło"}
              </Button>
            </Field>

            <FieldDescription className="text-center">
              <Link href="/login" className="underline">
                Wróć do logowania
              </Link>
            </FieldDescription>
          </>
        )}
      </FieldGroup>
    </form>
  );
}

export default function ResetPasswordPage() {
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
            <Suspense fallback={<div className="p-6 md:p-8" />}>
              <ResetPasswordForm />
            </Suspense>
            <AuthPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
