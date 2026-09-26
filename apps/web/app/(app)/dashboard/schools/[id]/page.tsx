"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  Undo2,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatPayoutSchedule,
  formatPLN,
  PAYOUT_STATUS_LABELS,
  type PayoutStatus,
  pluralize,
} from "@repo/shared";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { PageHeader } from "../../page-header";
import { SchoolDialog } from "../school-dialog";

const STATUS_CLASS: Record<PayoutStatus, string> = {
  paid: "bg-success/10 text-success border-success/20",
  due: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  open: "bg-muted text-muted-foreground",
};

export default function SchoolDetailPage() {
  const params = useParams<{ id: string }>();
  const schoolId = params.id;
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: school, isLoading } = trpc.schools.byId.useQuery({ id: schoolId });
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invalidate = () => {
    utils.schools.byId.invalidate({ id: schoolId });
    utils.schools.list.invalidate();
    utils.lessons.range.invalidate();
    utils.stats.summary.invalidate();
    utils.stats.analytics.invalidate();
  };

  const markPayout = trpc.schools.markPayout.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Zapisano przelew. Zajęcia z tego okresu są opłacone");
    },
    onError: (e) => toast.error(e.message),
  });

  const unmarkPayout = trpc.schools.unmarkPayout.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Cofnięto przelew");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteSchool = trpc.schools.delete.useMutation({
    onSuccess: () => {
      utils.schools.list.invalidate();
      utils.students.list.invalidate();
      toast.success("Usunięto szkółkę");
      router.push("/dashboard/schools");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-muted-foreground text-sm">Ładowanie…</p>;
  if (!school) return <p className="text-muted-foreground text-sm">Nie znaleziono.</p>;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        leading={
          <Button variant="outline" size="icon" asChild className="shrink-0">
            <Link href="/dashboard/schools" aria-label="Wróć do listy szkółek">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        }
        title={school.name}
        description={formatPayoutSchedule(school.payoutFrequency, school.payoutDay)}
        actions={
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edytuj
          </Button>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-12">
        <div className="order-1 flex flex-col gap-4 lg:col-span-4">
          <Card className="gap-3 p-5">
            <span className="font-semibold">Dane szkółki</span>
            <div className="text-muted-foreground flex flex-col gap-2 text-sm">
              {school.address && (
                <span className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  {school.address}
                </span>
              )}
              {school.contactName && (
                <span className="flex items-center gap-2">
                  <User className="size-3.5 shrink-0" />
                  {school.contactName}
                </span>
              )}
              {school.phone && (
                <a
                  href={`tel:${school.phone}`}
                  className="hover:text-foreground flex items-center gap-2"
                >
                  <Phone className="size-3.5 shrink-0" />
                  {school.phone}
                </a>
              )}
              {school.email && (
                <a
                  href={`mailto:${school.email}`}
                  className="hover:text-foreground flex items-center gap-2"
                >
                  <Mail className="size-3.5 shrink-0" />
                  {school.email}
                </a>
              )}
              {school.notes && <p className="whitespace-pre-wrap">{school.notes}</p>}
            </div>
          </Card>
        </div>

        <div className="order-3 flex flex-col gap-4 lg:order-2 lg:col-span-4 lg:col-start-1">
          <Card className="gap-3 p-5">
            <span className="font-semibold">Rozliczenia</span>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Czeka na przelew</span>
              <span className="text-warning font-semibold tabular-nums">
                {formatPLN(school.totals.awaiting)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Otrzymano łącznie</span>
              <span className="text-success font-semibold tabular-nums">
                {formatPLN(school.totals.received)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Zajęcia</span>
              <span className="font-semibold tabular-nums">
                {school.totals.lessonCount}
              </span>
            </div>
          </Card>

          <Card className="gap-3 p-5">
            <span className="font-semibold">Uczniowie ({school.students.length})</span>
            {school.students.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Przypisz ucznia do tej szkółki w zakładce „Uczniowie i stawki”.
              </p>
            ) : (
              <div className="flex flex-col">
                {school.students.map((student) => (
                  <span
                    key={student.id}
                    className="flex items-center justify-between border-b py-2 text-sm last:border-0"
                  >
                    {student.name}
                    {student.archived && (
                      <Badge className="bg-muted text-muted-foreground">archiwum</Badge>
                    )}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Button
            variant="destructive"
            className="w-fit"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-4" />
            Usuń szkółkę
          </Button>
        </div>

        <Card className="order-2 gap-0 p-0 lg:order-3 lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1">
          <div className="flex items-center justify-between gap-2 border-b px-5 py-4">
            <span className="font-semibold">Historia przelewów</span>
            <span className="text-muted-foreground text-xs">
              Zaznacz okres, za który przyszedł przelew
            </span>
          </div>

          {school.periods.length === 0 && (
            <p className="text-muted-foreground px-5 py-10 text-center text-sm">
              Brak zajęć w tej szkółce. Okresy rozliczeniowe pojawią się automatycznie.
            </p>
          )}

          <div className="flex flex-col">
            {school.periods.map((period) => (
              <div
                key={period.key}
                className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3 last:border-0"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium capitalize">{period.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {pluralize(period.lessonCount, "zajęcie", "zajęcia", "zajęć")}
                    {period.dueDate &&
                      ` · termin ${format(new Date(period.dueDate), "d MMM yyyy", { locale: pl })}`}
                    {period.payout &&
                      ` · wpłynęło ${format(new Date(period.payout.receivedOn), "d MMM yyyy", { locale: pl })}`}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums">
                    {formatPLN(
                      period.payout ? Number(period.payout.amount) : period.amount,
                    )}
                  </span>
                  <Badge className={cn("shrink-0", STATUS_CLASS[period.status])}>
                    {PAYOUT_STATUS_LABELS[period.status]}
                  </Badge>
                  {period.payout ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={unmarkPayout.isPending}
                      onClick={() => unmarkPayout.mutate({ id: period.payout!.id })}
                    >
                      <Undo2 className="size-3.5" />
                      Cofnij
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={markPayout.isPending || period.lessonCount === 0}
                      onClick={() =>
                        markPayout.mutate({ schoolId, periodKey: period.key })
                      }
                    >
                      <Check className="size-3.5" />
                      Przelew przyszedł
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <SchoolDialog open={editOpen} onOpenChange={setEditOpen} schoolId={schoolId} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć szkółkę?</AlertDialogTitle>
            <AlertDialogDescription>
              Uczniowie zostaną zachowani, ale wrócą do rozliczeń prywatnych, a historia
              przelewów zniknie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteSchool.mutate({ id: schoolId })}>
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
