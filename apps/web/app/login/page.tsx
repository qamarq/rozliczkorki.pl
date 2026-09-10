"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      toast.error(error.message ?? "Nie udało się zalogować");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function onGoogle() {
    await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
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
    <div className="relative isolate flex min-h-svh items-center justify-center overflow-hidden px-6">
      <div className="bg-brand-gradient pointer-events-none absolute left-1/2 top-1/4 -z-10 h-72 w-72 -translate-x-1/2 rounded-full opacity-20 blur-[100px]" />
      <Card className="border-border/60 bg-card/80 relative w-full max-w-sm backdrop-blur-sm">
        <CardHeader>
          <Logo className="mb-1 size-9" />
          <CardTitle className="text-brand-gradient text-xl">Zaloguj się</CardTitle>
          <CardDescription>Wpisz dane, żeby wejść do panelu.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={onGoogle} type="button">
              Kontynuuj przez Google
            </Button>
            <Button variant="outline" onClick={onPasskey} type="button">
              Zaloguj kluczem dostępu
            </Button>
          </div>

          <div className="text-muted-foreground my-4 flex items-center gap-3 text-xs">
            <span className="bg-border-solid h-px flex-1" />
            lub e-mailem
            <span className="bg-border-solid h-px flex-1" />
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username webauthn"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-brand-gradient text-white hover:opacity-90"
            >
              {loading ? "Logowanie…" : "Zaloguj się"}
            </Button>
          </form>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            Nie masz konta?{" "}
            <Link href="/register" className="underline">
              Załóż konto
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
