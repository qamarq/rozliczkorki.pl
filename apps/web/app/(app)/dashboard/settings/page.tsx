"use client";

import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { KeyRound, Laptop, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient, useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";

type SessionRow = {
  id: string;
  token: string;
  createdAt: string;
  userAgent?: string | null;
};

type PasskeyRow = {
  id: string;
  name?: string | null;
  createdAt: string;
  deviceType: string;
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();
  const { data: passwordInfo } = trpc.auth.hasPassword.useQuery();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [addingPasskey, setAddingPasskey] = useState(false);
  const [newAccountPassword, setNewAccountPassword] = useState("");

  const setPassword = trpc.auth.setPassword.useMutation({
    onSuccess: () => {
      utils.auth.hasPassword.invalidate();
      setNewAccountPassword("");
      toast.success("Hasło zostało ustawione");
    },
    onError: (e) => toast.error(e.message),
  });

  function onSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newAccountPassword.length < 8) {
      toast.error("Hasło musi mieć min. 8 znaków");
      return;
    }
    setPassword.mutate({ newPassword: newAccountPassword });
  }

  async function loadSessions() {
    const { data } = await authClient.$fetch<SessionRow[]>("/list-sessions");
    if (data) setSessions(data);
  }

  async function loadPasskeys() {
    const { data } = await authClient.$fetch<PasskeyRow[]>("/passkey/list-user-passkeys");
    if (data) setPasskeys(data);
  }

  useEffect(() => {
    loadSessions();
    loadPasskeys();
  }, []);

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || newPassword.length < 8) {
      toast.error("Hasło musi mieć min. 8 znaków");
      return;
    }
    setSavingPassword(true);
    const { error } = await authClient.$fetch("/change-password", {
      method: "POST",
      body: { currentPassword, newPassword, revokeOtherSessions: true },
    });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message ?? "Nie udało się zmienić hasła");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    toast.success("Hasło zostało zmienione");
    loadSessions();
  }

  async function onRevoke(token: string) {
    await authClient.$fetch("/revoke-session", { method: "POST", body: { token } });
    loadSessions();
  }

  async function onAddPasskey() {
    setAddingPasskey(true);
    const { error } = await authClient.passkey.addPasskey();
    setAddingPasskey(false);
    if (error) {
      toast.error(error.message ?? "Nie udało się dodać klucza dostępu");
      return;
    }
    toast.success("Dodano klucz dostępu");
    loadPasskeys();
  }

  async function onDeletePasskey(id: string) {
    await authClient.$fetch("/passkey/delete-passkey", { method: "POST", body: { id } });
    loadPasskeys();
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold">Ustawienia konta</h1>
        <p className="text-muted-foreground text-sm">
          Profil, logowanie kluczem dostępu i aktywne sesje.
        </p>
      </div>

      <Card className="flex-row items-center gap-4 p-4">
        <span className="bg-primary/15 text-primary flex size-12 items-center justify-center rounded-full text-lg font-semibold">
          {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
        </span>
        <div className="flex flex-col">
          <span className="font-medium">{session?.user?.name}</span>
          <span className="text-muted-foreground text-sm">{session?.user?.email}</span>
        </div>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Klucze dostępu (passkeys)</CardTitle>
          <Button size="sm" onClick={onAddPasskey} disabled={addingPasskey}>
            <Plus className="size-4" />
            Dodaj klucz
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {passkeys.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Nie masz jeszcze zapisanego klucza dostępu (Face ID, Touch ID, klucz
              sprzętowy).
            </p>
          )}
          {passkeys.map((p) => (
            <div
              key={p.id}
              className="border-border-solid flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div className="flex items-center gap-2 text-sm">
                <KeyRound className="text-muted-foreground size-4" />
                <span className="font-medium">{p.name || "Klucz dostępu"}</span>
                <span className="text-muted-foreground">
                  · dodano{" "}
                  {formatDistanceToNow(new Date(p.createdAt), {
                    addSuffix: true,
                    locale: pl,
                  })}
                </span>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => onDeletePasskey(p.id)}>
                <Trash2 className="text-destructive size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {passwordInfo && !passwordInfo.hasPassword ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ustaw hasło</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              Założyłeś(-aś) konto przez Google, więc nie masz jeszcze hasła. Ustaw je,
              jeśli chcesz móc logować się też e-mailem i hasłem.
            </p>
            <form onSubmit={onSetPassword} className="flex flex-col gap-4">
              <div className="flex max-w-xs flex-col gap-2">
                <Label htmlFor="newAccountPassword">Nowe hasło</Label>
                <Input
                  id="newAccountPassword"
                  type="password"
                  value={newAccountPassword}
                  onChange={(e) => setNewAccountPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={setPassword.isPending}
                className="self-start"
              >
                {setPassword.isPending ? "Zapisywanie…" : "Ustaw hasło"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Zmiana hasła</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onChangePassword} className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="currentPassword">Obecne hasło</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="newPassword">Nowe hasło</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={savingPassword} className="self-start">
                {savingPassword ? "Zapisywanie…" : "Zmień hasło"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Aktywne sesje</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {sessions.length === 0 && (
            <p className="text-muted-foreground text-sm">Brak innych aktywnych sesji</p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className="border-border-solid flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div className="flex items-center gap-2 text-sm">
                <Laptop className="text-muted-foreground size-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{s.userAgent ?? "Nieznane urządzenie"}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(s.createdAt), {
                      addSuffix: true,
                      locale: pl,
                    })}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => onRevoke(s.token)}>
                <Trash2 className="text-destructive size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-sm">
        Chcesz usunąć konto?{" "}
        <Link href="/delete-account" className="text-primary underline">
          Zobacz jak to zrobić
        </Link>
        .
      </p>
    </div>
  );
}
