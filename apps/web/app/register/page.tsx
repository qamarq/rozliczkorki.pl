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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await authClient.signUp.email({ name, email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Nie udało się założyć konta");
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
          <CardTitle className="text-brand-gradient text-xl">Załóż konto</CardTitle>
          <CardDescription>Za darmo, zajmie minutę.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Imię</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-brand-gradient text-white hover:opacity-90"
            >
              {loading ? "Zakładanie…" : "Załóż konto"}
            </Button>
          </form>
          <p className="text-muted-foreground mt-4 text-center text-sm">
            Masz już konto?{" "}
            <Link href="/login" className="underline">
              Zaloguj się
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
