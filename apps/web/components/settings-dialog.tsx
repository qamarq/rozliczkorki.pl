"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import {
  BadgeCheck,
  KeyRound,
  Laptop,
  Link2,
  Mail,
  Plus,
  Shield,
  Smartphone,
  Trash2,
  TriangleAlert,
  User as UserIcon,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AppleIcon } from "@/components/apple-icon";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { clearHash, pushHash, replaceHash, useHash } from "@/hooks/use-hash";
import { authClient, useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { pluralize } from "@repo/shared";

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
  {
    id: "profile",
    name: "Profil",
    description: "Imię i adres e-mail przypisane do konta.",
    icon: UserIcon,
  },
  {
    id: "security",
    name: "Logowanie",
    description: "Hasło i klucze dostępu.",
    icon: Shield,
  },
  {
    id: "accounts",
    name: "Połączone konta",
    description: "Sposoby logowania podpięte do tego konta.",
    icon: Link2,
  },
  {
    id: "sessions",
    name: "Aktywne sesje",
    description: "Urządzenia, na których jesteś zalogowany(-a).",
    icon: Laptop,
  },
  {
    id: "danger",
    name: "Usuwanie konta",
    description: "Trwałe usunięcie konta razem ze wszystkimi danymi.",
    icon: TriangleAlert,
  },
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

const INPUT = "bg-background h-10 rounded-[10px] px-3 md:text-sm";
const ACTION = "h-10 shrink-0 rounded-[10px] px-4";

function describeDevice(userAgent?: string | null) {
  if (!userAgent) return { label: "Nieznane urządzenie", mobile: false };
  if (/okhttp|Dalvik|CFNetwork|Expo/i.test(userAgent)) {
    const platform = /okhttp|Dalvik|Android/i.test(userAgent) ? "Android" : "iPhone";
    return { label: `Aplikacja RozliczKorki · ${platform}`, mobile: true };
  }
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\//.test(userAgent)
      ? "Opera"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Chrome\//.test(userAgent)
          ? "Chrome"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : null;
  const os = /iPhone/.test(userAgent)
    ? "iPhone"
    : /iPad/.test(userAgent)
      ? "iPad"
      : /Android/.test(userAgent)
        ? "Android"
        : /Mac OS X/.test(userAgent)
          ? "macOS"
          : /Windows/.test(userAgent)
            ? "Windows"
            : /Linux/.test(userAgent)
              ? "Linux"
              : null;
  const mobile = os === "iPhone" || os === "Android";
  if (!browser && !os) return { label: userAgent, mobile };
  return { label: [browser, os].filter(Boolean).join(" · "), mobile };
}

function SectionCard({
  title,
  description,
  action,
  danger,
  children,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "bg-card ring-foreground/10 flex flex-col gap-4 rounded-2xl p-5 ring-1",
        danger && "bg-destructive/[0.04] ring-destructive/30",
      )}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            {title && <h3 className="text-[15px] font-semibold">{title}</h3>}
            {description && (
              <p className="text-muted-foreground text-pretty text-sm">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="divide-border -my-1 flex flex-col divide-y">{children}</ul>;
}

function Row({
  icon,
  title,
  meta,
  children,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-secondary text-muted-foreground grid size-9 shrink-0 place-items-center rounded-[10px] [&_svg]:size-4">
          {icon}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{title}</span>
          {meta && <span className="text-muted-foreground truncate text-xs">{meta}</span>}
        </div>
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </li>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-border text-muted-foreground rounded-xl border border-dashed px-4 py-5 text-center text-sm">
      {children}
    </p>
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
    <div className="flex flex-col gap-4">
      <section className="bg-card ring-foreground/10 flex items-center gap-4 rounded-2xl p-5 ring-1">
        <Avatar className="size-14 rounded-2xl">
          <AvatarImage
            src={user?.image ?? undefined}
            alt={user?.name ?? ""}
            className="rounded-2xl"
          />
          <AvatarFallback className="rounded-2xl text-base">
            {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="font-display truncate text-xl font-semibold leading-tight">
            {user?.name}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground truncate text-sm">{user?.email}</span>
            {user?.emailVerified ? (
              <span className="bg-paid-soft text-success inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
                <BadgeCheck className="size-3.5" />
                Potwierdzony
              </span>
            ) : (
              <span className="bg-owed-soft text-warning rounded-full px-2 py-0.5 text-xs font-semibold">
                Niepotwierdzony
              </span>
            )}
          </div>
        </div>
      </section>

      {!user?.emailVerified && (
        <div className="bg-owed-soft flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4">
          <p className="text-pretty text-sm">
            Potwierdź adres, żeby odzyskiwanie hasła i przypomnienia o lekcjach działały.
          </p>
          <Button variant="outline" className={ACTION} onClick={onResendVerification}>
            Wyślij link
          </Button>
        </div>
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
                  className={INPUT}
                />
                <Button
                  type="submit"
                  className={ACTION}
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
                  className={INPUT}
                />
                <Button
                  type="submit"
                  variant="outline"
                  className={ACTION}
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
    <div className="flex flex-col gap-4">
      {passwordInfo && !passwordInfo.hasPassword ? (
        <SectionCard
          title="Ustaw hasło"
          description="Konto założone przez Google lub Apple nie ma hasła. Ustaw je, żeby logować się też e-mailem."
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
                    className={INPUT}
                  />
                  <Button
                    type="submit"
                    className={ACTION}
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
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="current-password">Obecne hasło</FieldLabel>
                  <Input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={INPUT}
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
                    className={INPUT}
                  />
                </Field>
              </div>
              <div>
                <Button type="submit" className={ACTION} disabled={savingPassword}>
                  {savingPassword ? "Zapisywanie…" : "Zmień hasło"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </SectionCard>
      )}

      <SectionCard
        title="Klucze dostępu"
        description="Face ID, Touch ID albo klucz sprzętowy zamiast hasła."
        action={
          <Button
            variant="outline"
            className={ACTION}
            onClick={onAddPasskey}
            disabled={addingPasskey}
          >
            <Plus data-icon="inline-start" />
            Dodaj klucz
          </Button>
        }
      >
        {passkeys.length === 0 ? (
          <EmptyNote>Nie masz jeszcze zapisanego klucza dostępu.</EmptyNote>
        ) : (
          <List>
            {passkeys.map((p) => (
              <Row
                key={p.id}
                icon={<KeyRound />}
                title={p.name || "Klucz dostępu"}
                meta={`Dodano ${relative(p.createdAt)}`}
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDeletePasskey(p.id)}
                  title="Usuń klucz"
                  aria-label="Usuń klucz"
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </Row>
            ))}
          </List>
        )}
      </SectionCard>
    </div>
  );
}
const SOCIAL_PROVIDERS = {
  google: { label: "Google", Icon: GoogleIcon },
  apple: { label: "Apple", Icon: AppleIcon },
} as const;

type SocialProvider = keyof typeof SOCIAL_PROVIDERS;

function AccountsSection() {
  const { data: accounts = [], refetch: load } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data } = await authClient.$fetch<AccountRow[]>("/list-accounts");
      return data ?? [];
    },
  });

  const credential = accounts.find((a) => a.providerId === "credential");

  async function onLink(provider: SocialProvider) {
    await authClient.linkSocial({ provider, callbackURL: "/dashboard" });
  }

  async function onUnlink(provider: SocialProvider, accountId: string) {
    const { error } = await authClient.unlinkAccount({ accountId });
    if (error) {
      toast.error(error.message ?? "Nie udało się odłączyć konta");
      return;
    }
    toast.success(`Odłączono konto ${SOCIAL_PROVIDERS[provider].label}`);
    load();
  }

  return (
    <SectionCard>
      <List>
        {(Object.keys(SOCIAL_PROVIDERS) as SocialProvider[]).map((provider) => {
          const { label, Icon } = SOCIAL_PROVIDERS[provider];
          const linked = accounts.find((a) => a.providerId === provider);
          return (
            <Row
              key={provider}
              icon={<Icon />}
              title={label}
              meta={linked ? `Podłączone ${relative(linked.createdAt)}` : "Niepodłączone"}
            >
              {linked ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUnlink(provider, linked.id)}
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
                <Button variant="outline" size="sm" onClick={() => onLink(provider)}>
                  Podłącz
                </Button>
              )}
            </Row>
          );
        })}

        <Row
          icon={<Mail />}
          title="E-mail i hasło"
          meta={
            credential ? "Możesz logować się hasłem" : "Ustaw hasło w zakładce Logowanie"
          }
        >
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              credential
                ? "bg-paid-soft text-success"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {credential ? "Aktywne" : "Brak hasła"}
          </span>
        </Row>
      </List>
    </SectionCard>
  );
}
function SessionsSection() {
  const { data: current } = useSession();
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
      title={pluralize(sessions.length, "urządzenie", "urządzenia", "urządzeń")}
      description="Bieżące urządzenie jest oznaczone."
      action={
        <Button
          variant="outline"
          className={ACTION}
          onClick={onRevokeOthers}
          disabled={revokingAll || sessions.length < 2}
        >
          {revokingAll ? "Wylogowywanie…" : "Wyloguj pozostałe"}
        </Button>
      }
    >
      {sessions.length === 0 ? (
        <EmptyNote>Brak aktywnych sesji.</EmptyNote>
      ) : (
        <List>
          {sessions.map((s) => {
            const device = describeDevice(s.userAgent);
            const isCurrent = current?.session.id === s.id;
            return (
              <Row
                key={s.id}
                icon={device.mobile ? <Smartphone /> : <Laptop />}
                title={<span title={s.userAgent ?? undefined}>{device.label}</span>}
                meta={`Zalogowano ${relative(s.createdAt)}`}
              >
                {isCurrent ? (
                  <span className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
                    To urządzenie
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRevoke(s.token)}
                    title="Wyloguj to urządzenie"
                    aria-label="Wyloguj to urządzenie"
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                )}
              </Row>
            );
          })}
        </List>
      )}
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
      danger
      title="Usunięcie konta"
      description="Znikną wszystkie lekcje, stawki i dane uczniów. Tej operacji nie da się cofnąć."
    >
      <p className="text-muted-foreground text-pretty text-sm">
        Dla bezpieczeństwa wyślemy na Twój adres e-mail link potwierdzający. Konto
        zostanie usunięte dopiero po kliknięciu w niego.
      </p>
      <Button
        variant="destructive"
        className={cn(ACTION, "self-start")}
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 data-icon="inline-start" />
        Usuń konto
      </Button>

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
  const headingRef = useRef<HTMLHeadingElement>(null);

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
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          headingRef.current?.focus();
        }}
        className="bg-background gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[940px]"
      >
        <DialogTitle className="sr-only">Ustawienia konta</DialogTitle>
        <DialogDescription className="sr-only">
          Profil, logowanie, połączone konta i aktywne sesje.
        </DialogDescription>

        <div className="grid h-[min(640px,85svh)] md:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="bg-sidebar border-border hidden flex-col gap-1 border-r p-3 md:flex">
            <p className="text-muted-foreground px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-[0.08em]">
              Ustawienia
            </p>
            {SECTIONS.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === section;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectSection(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-[10px] px-3 text-left text-sm transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
                    item.id === "danger" && "mt-auto",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                    item.id === "danger" && !isActive && "hover:text-destructive",
                  )}
                >
                  <Icon />
                  {item.name}
                </button>
              );
            })}
          </aside>

          <main className="flex min-h-0 min-w-0 flex-col">
            <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-5 md:px-8 md:pt-7">
              <div className="flex min-w-0 flex-col gap-1">
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-display text-2xl font-semibold leading-tight outline-none md:text-[1.75rem]"
                >
                  {active.name}
                </h2>
                <p className="text-muted-foreground text-pretty text-sm">
                  {active.description}
                </p>
              </div>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-2 -mt-1 shrink-0"
                  aria-label="Zamknij ustawienia"
                >
                  <X />
                </Button>
              </DialogClose>
            </header>

            <nav className="border-border flex shrink-0 gap-1.5 overflow-x-auto border-b px-5 pb-3 md:hidden">
              {SECTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectSection(item.id)}
                  aria-current={item.id === section ? "page" : undefined}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    item.id === section
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.name}
                </button>
              ))}
            </nav>

            <div
              key={section}
              className="animate-in fade-in-0 slide-in-from-bottom-1 min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4 duration-300 motion-reduce:animate-none md:px-8 md:pb-8"
            >
              {section === "profile" && <ProfileSection />}
              {section === "security" && <SecuritySection />}
              {section === "accounts" && <AccountsSection />}
              {section === "sessions" && <SessionsSection />}
              {section === "danger" && <DangerSection />}
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
