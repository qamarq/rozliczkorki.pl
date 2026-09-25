"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { AUTH_INPUT, AUTH_SUBMIT, AuthHeading, AuthSwitch } from "@/components/auth-ui";
import { PageTransition } from "@/components/marketing/page-transition";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col gap-8">
      <AuthHeading
        title="Ustaw nowe hasło"
        description={
          invalidLink
            ? "Ten link wygasł albo został już użyty."
            : "Wpisz nowe hasło do swojego konta."
        }
      />

      {invalidLink ? (
        <Button asChild className={AUTH_SUBMIT}>
          <Link href="/forgot-password">Poproś o nowy link</Link>
        </Button>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mk-rise"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <FieldGroup className="gap-5">
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
                className={AUTH_INPUT}
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
                className={AUTH_INPUT}
              />
              <FieldDescription>
                {passwordsMismatch ? "Hasła nie są takie same." : "Minimum 8 znaków."}
              </FieldDescription>
            </Field>

            <Button type="submit" disabled={loading} className={AUTH_SUBMIT}>
              {loading ? "Zapisywanie…" : "Zmień hasło"}
            </Button>
          </FieldGroup>
        </form>
      )}

      <AuthSwitch
        text="Pamiętasz jednak hasło?"
        href="/login"
        label="Wróć do logowania"
      />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-80" />}>
        <ResetPasswordForm />
      </Suspense>
    </PageTransition>
  );
}
