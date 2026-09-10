"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-6">
      <div className="bg-brand-gradient pointer-events-none absolute left-1/2 top-1/4 h-72 w-72 -translate-x-1/2 rounded-full opacity-20 blur-[100px]" />
      <Card className="border-border/60 bg-card/80 relative w-full max-w-sm backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-brand-gradient text-xl">Zaloguj się</CardTitle>
          <CardDescription>Wpisz dane, żeby wejść do panelu.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
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
