"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import {
  BadgeCheck,
  KeyRound,
  Laptop,
  Link2,
  Plus,
  Shield,
  Trash2,
  TriangleAlert,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { GoogleIcon } from "@/components/google-icon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { clearHash, pushHash, replaceHash, useHash } from "@/hooks/use-hash";
import { authClient, useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

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

type AccountRow = {
  id: string;
  providerId: string;
  accountId: string;
  createdAt: string;
};

const SECTIONS = [
  { id: "profile", name: "Profil", icon: UserIcon },
  { id: "security", name: "Logowanie", icon: Shield },
  { id: "accounts", name: "Połączone konta", icon: Link2 },
  { id: "sessions", name: "Aktywne sesje", icon: Laptop },
  { id: "danger", name: "Usuwanie konta", icon: TriangleAlert },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const SETTINGS_HASH = "settings";
const DEFAULT_SECTION: SectionId = "profile";

function sectionFromHash(hash: string): SectionId | null {
  if (hash !== SETTINGS_HASH && !hash.startsWith(`${SETTINGS_HASH}/`)) return null;
  const slug = hash.slice(SETTINGS_HASH.length + 1);
  return SECTIONS.find((s) => s.id === slug)?.id ?? DEFAULT_SECTION;
}

export function openSettings(section: SectionId = DEFAULT_SECTION) {
  pushHash(`${SETTINGS_HASH}/${section}`);
}

function relative(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: pl });
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-medium">{title}</h3>
          {description && (
            <p className="text-muted-foreground text-balance text-xs">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border-solid flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
      {children}
    </div>
  );
}

function ProfileSection() {
  const { data: session, refetch } = useSession();
  const user = session?.user;

  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const name = nameDraft ?? user?.name ?? "";
  const [newEmail, setNewEmail] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  async function onSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    const { error } = await authClient.updateUser({ name });
    setSavingName(false);
    if (error) {
      toast.error(error.message ?? "Nie udało się zapisać imienia");
      return;
    }
    setNameDraft(null);
    await refetch();
    toast.success("Zapisano");
  }

  async function onChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setSavingEmail(true);
    const { error } = await authClient.changeEmail({
      newEmail,
      callbackURL: "/dashboard",
    });
    setSavingEmail(false);
    if (error) {
      toast.error(error.message ?? "Nie udało się zmienić adresu");
      return;
    }
    setNewEmail("");
    toast.success("Wysłaliśmy link potwierdzający na obecny adres");
  }

  async function onResendVerification() {
    if (!user?.email) return;
    const { error } = await authClient.sendVerificationEmail({
      email: user.email,
      callbackURL: "/dashboard",
    });
    if (error) {
      toast.error(error.message ?? "Nie udało się wysłać maila");
      return;
    }
    toast.success("Wysłaliśmy link potwierdzający");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Avatar className="size-12 rounded-xl">
          <AvatarImage
            src={user?.image ?? undefined}
            alt={user?.name ?? ""}
            className="rounded-xl"
          />
          <AvatarFallback className="rounded-xl">
            {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm font-medium">{user?.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
            {user?.emailVerified ? (
              <Badge variant="secondary" className="gap-1">
                <BadgeCheck className="size-3" />
                Potwierdzony
              </Badge>
            ) : (
              <Badge variant="outline">Niepotwierdzony</Badge>
            )}
          </div>
        </div>
      </div>

      {!user?.emailVerified && (
        <Row>
          <p className="text-muted-foreground text-balance text-xs">
            Potwierdź adres, żeby odzyskiwanie hasła i przypomnienia o lekcjach działały.
          </p>
          <Button size="sm" variant="outline" onClick={onResendVerification}>
            Wyślij link
          </Button>
        </Row>
      )}

      <SectionCard title="Imię" description="Widoczne w panelu i w mailach.">
        <form onSubmit={onSaveName}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="settings-name" className="sr-only">
                Imię
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(e) => setNameDraft(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="shrink-0"
                  disabled={savingName || name === user?.name || !name}
                >
                  {savingName ? "Zapisywanie…" : "Zapisz"}
                </Button>
              </div>
            </Field>
          </FieldGroup>
        </form>
      </SectionCard>

      <SectionCard
        title="Adres e-mail"
        description="Na obecny adres wyślemy link potwierdzający zmianę."
      >
        <form onSubmit={onChangeEmail}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="settings-email">Nowy e-mail</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="settings-email"
                  type="email"
                  placeholder={user?.email}
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="shrink-0"
                  disabled={savingEmail}
                >
                  {savingEmail ? "Wysyłanie…" : "Zmień"}
                </Button>
              </div>
            </Field>
          </FieldGroup>
        </form>
      </SectionCard>
    </div>
  );
}

function SecuritySection() {
  const utils = trpc.useUtils();
  const { data: passwordInfo } = trpc.auth.hasPassword.useQuery();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newAccountPassword, setNewAccountPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [addingPasskey, setAddingPasskey] = useState(false);

  const { data: passkeys = [], refetch: loadPasskeys } = useQuery({
    queryKey: ["passkeys"],
    queryFn: async () => {
      const { data } = await authClient.$fetch<PasskeyRow[]>(
        "/passkey/list-user-passkeys",
      );
      return data ?? [];
    },
  });

  const setPassword = trpc.auth.setPassword.useMutation({
    onSuccess: () => {
      utils.auth.hasPassword.invalidate();
      setNewAccountPassword("");
      toast.success("Hasło zostało ustawione");
    },
    onError: (e) => toast.error(e.message),
  });

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || newPassword.length < 8) {
      toast.error("Hasło musi mieć min. 8 znaków");
      return;
    }
    setSavingPassword(true);
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message ?? "Nie udało się zmienić hasła");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    toast.success("Hasło zmienione, inne sesje wylogowane");
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
    await authClient.$fetch("/passkey/delete-passkey", {
      method: "POST",
      body: { id },
    });
    loadPasskeys();
  }

  return (
    <div className="flex flex-col gap-6">
      {passwordInfo && !passwordInfo.hasPassword ? (
        <SectionCard
          title="Ustaw hasło"
          description="Konto założone przez Google nie ma hasła. Ustaw je, żeby logować się też e-mailem."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newAccountPassword.length < 8) {
                toast.error("Hasło musi mieć min. 8 znaków");
                return;
              }
              setPassword.mutate({ newPassword: newAccountPassword });
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="set-password">Nowe hasło</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="set-password"
                    type="password"
                    autoComplete="new-password"
                    value={newAccountPassword}
                    onChange={(e) => setNewAccountPassword(e.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="shrink-0"
                    disabled={setPassword.isPending}
                  >
                    {setPassword.isPending ? "Zapisywanie…" : "Ustaw"}
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          </form>
        </SectionCard>
      ) : (
        <SectionCard
          title="Zmiana hasła"
          description="Po zmianie wylogujemy pozostałe urządzenia."
        >
          <form onSubmit={onChangePassword}>
            <FieldGroup>
              <Field className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="current-password">Obecne hasło</FieldLabel>
                  <Input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="new-password">Nowe hasło</FieldLabel>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </Field>
              </Field>
              <Field>
                <div>
                  <Button type="submit" variant="outline" disabled={savingPassword}>
                    {savingPassword ? "Zapisywanie…" : "Zmień hasło"}
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          </form>
        </SectionCard>
      )}

      <SectionCard
        title="Klucze dostępu"
        description="Face ID, Touch ID albo klucz sprzętowy zamiast hasła."
        action={
          <Button size="sm" onClick={onAddPasskey} disabled={addingPasskey}>
            <Plus data-icon="inline-start" />
            Dodaj klucz
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {passkeys.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Nie masz jeszcze zapisanego klucza dostępu.
            </p>
          )}
          {passkeys.map((p) => (
            <Row key={p.id}>
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <KeyRound className="text-muted-foreground size-4 shrink-0" />
                <span className="truncate font-medium">{p.name || "Klucz dostępu"}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  · dodano {relative(p.createdAt)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDeletePasskey(p.id)}
                title="Usuń klucz"
              >
                <Trash2 className="text-destructive" />
              </Button>
            </Row>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function AccountsSection() {
  const { data: accounts = [], refetch: load } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data } = await authClient.$fetch<AccountRow[]>("/list-accounts");
      return data ?? [];
    },
  });

  const google = accounts.find((a) => a.providerId === "google");
  const credential = accounts.find((a) => a.providerId === "credential");

  async function onLinkGoogle() {
    await authClient.linkSocial({ provider: "google", callbackURL: "/dashboard" });
  }

  async function onUnlinkGoogle() {
    if (!google) return;
    const { error } = await authClient.unlinkAccount({ accountId: google.id });
    if (error) {
      toast.error(error.message ?? "Nie udało się odłączyć konta");
      return;
    }
    toast.success("Odłączono konto Google");
    load();
  }

  return (
    <SectionCard
      title="Połączone konta"
      description="Sposoby logowania podpięte do tego konta."
    >
      <div className="flex flex-col gap-2">
        <Row>
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <GoogleIcon className="size-4 shrink-0" />
            <span className="font-medium">Google</span>
            {google && (
              <span className="text-muted-foreground shrink-0 text-xs">
                · podłączone {relative(google.createdAt)}
              </span>
            )}
          </div>
          {google ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUnlinkGoogle}
              disabled={accounts.length < 2}
              title={
                accounts.length < 2
                  ? "To jedyny sposób logowania, najpierw ustaw hasło"
                  : undefined
              }
            >
              Odłącz
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onLinkGoogle}>
              Podłącz
            </Button>
          )}
        </Row>

        <Row>
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <KeyRound className="text-muted-foreground size-4 shrink-0" />
            <span className="font-medium">E-mail i hasło</span>
          </div>
          <Badge variant={credential ? "secondary" : "outline"}>
            {credential ? "Aktywne" : "Brak hasła"}
          </Badge>
        </Row>
      </div>
    </SectionCard>
  );
}

function SessionsSection() {
  const [revokingAll, setRevokingAll] = useState(false);

  const { data: sessions = [], refetch: load } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data } = await authClient.$fetch<SessionRow[]>("/list-sessions");
      return data ?? [];
    },
  });

  async function onRevoke(token: string) {
    await authClient.revokeSession({ token });
    load();
  }

  async function onRevokeOthers() {
    setRevokingAll(true);
    const { error } = await authClient.revokeOtherSessions();
    setRevokingAll(false);
    if (error) {
      toast.error(error.message ?? "Nie udało się wylogować urządzeń");
      return;
    }
    toast.success("Wylogowano pozostałe urządzenia");
    load();
  }

  return (
    <SectionCard
      title="Aktywne sesje"
      description="Urządzenia, na których jesteś zalogowany(-a)."
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={onRevokeOthers}
          disabled={revokingAll || sessions.length < 2}
        >
          {revokingAll ? "Wylogowywanie…" : "Wyloguj pozostałe"}
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        {sessions.length === 0 && (
          <p className="text-muted-foreground text-sm">Brak aktywnych sesji.</p>
        )}
        {sessions.map((s) => (
          <Row key={s.id}>
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <Laptop className="text-muted-foreground size-4 shrink-0" />
              <div className="flex min-w-0 flex-col">
                <span className="line-clamp-1 break-all font-medium">
                  {s.userAgent ?? "Nieznane urządzenie"}
                </span>
                <span className="text-muted-foreground text-xs">
                  {relative(s.createdAt)}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onRevoke(s.token)}
              title="Wyloguj to urządzenie"
            >
              <Trash2 className="text-destructive" />
            </Button>
          </Row>
        ))}
      </div>
    </SectionCard>
  );
}

function DangerSection() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  async function onDelete() {
    setSending(true);
    const { error } = await authClient.deleteUser({ callbackURL: "/" });
    setSending(false);
    setConfirmOpen(false);
    if (error) {
      toast.error(error.message ?? "Nie udało się rozpocząć usuwania konta");
      return;
    }
    toast.success("Wysłaliśmy link potwierdzający na Twój e-mail");
  }

  return (
    <SectionCard
      title="Usunięcie konta"
      description="Znikną wszystkie lekcje, stawki i dane uczniów. Tej operacji nie da się cofnąć."
    >
      <div className="border-destructive/40 bg-destructive/5 flex flex-col gap-3 rounded-lg border p-4">
        <p className="text-muted-foreground text-balance text-xs">
          Dla bezpieczeństwa wyślemy na Twój adres e-mail link potwierdzający. Konto
          zostanie usunięte dopiero po kliknięciu w niego.
        </p>
        <Button
          variant="destructive"
          size="sm"
          className="self-start"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 data-icon="inline-start" />
          Usuń konto
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Na pewno usunąć konto?</AlertDialogTitle>
            <AlertDialogDescription>
              Wyślemy link potwierdzający na Twój adres e-mail. Po jego kliknięciu konto i
              wszystkie dane zostaną trwale usunięte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={sending}
              className="bg-destructive text-white hover:opacity-90"
            >
              {sending ? "Wysyłanie…" : "Wyślij link"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}

export function SettingsDialog() {
  const hashSection = sectionFromHash(useHash());
  const section = hashSection ?? DEFAULT_SECTION;
  const active = SECTIONS.find((s) => s.id === section)!;

  function selectSection(id: SectionId) {
    replaceHash(`${SETTINGS_HASH}/${id}`);
  }

  return (
    <Dialog
      open={hashSection !== null}
      onOpenChange={(next) => {
        if (!next) clearHash();
      }}
    >
      <DialogContent className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[900px] lg:max-w-[980px]">
        <DialogTitle className="sr-only">Ustawienia konta</DialogTitle>
        <DialogDescription className="sr-only">
          Profil, logowanie, połączone konta i aktywne sesje.
        </DialogDescription>

        <SidebarProvider className="min-h-0 items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarGroupLabel>Ustawienia</SidebarGroupLabel>
                  <SidebarMenu>
                    {SECTIONS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            isActive={item.id === section}
                            onClick={() => selectSection(item.id)}
                            className="h-9 gap-3 rounded-lg px-3"
                          >
                            <Icon />
                            <span>{item.name}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <main className="flex h-[75svh] min-w-0 flex-1 flex-col overflow-hidden md:h-[600px]">
            <header className="flex h-14 shrink-0 items-center gap-2 px-4 md:h-16">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">Ustawienia</BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{active.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>

            <nav className="flex shrink-0 gap-1 overflow-x-auto px-4 pb-2 md:hidden">
              {SECTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectSection(item.id)}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    item.id === section
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {item.name}
                </button>
              ))}
            </nav>

            <div className="flex-1 overflow-y-auto px-4 pb-6 pt-1">
              {section === "profile" && <ProfileSection />}
              {section === "security" && <SecuritySection />}
              {section === "accounts" && <AccountsSection />}
              {section === "sessions" && <SessionsSection />}
              {section === "danger" && <DangerSection />}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
