"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  BellRing,
  CalendarRange,
  CalendarX2,
  Check,
  Pencil,
  Phone,
  Plus,
  Trash2,
  TreePalm,
  Undo2,
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
import { pluralize } from "@/lib/lessons";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { formatVacationRange, useSetNotified } from "./notice-panel";
import { type EditableVacation, VacationDialog } from "./vacation-dialog";

export default function VacationsPage() {
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<EditableVacation | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data, isLoading } = trpc.vacations.overview.useQuery({
    today: format(new Date(), "yyyy-MM-dd"),
  });
  const setNotified = useSetNotified();

  const deleteVacation = trpc.vacations.delete.useMutation({
    onSuccess: () => {
      utils.vacations.overview.invalidate();
      utils.lessons.range.invalidate();
      utils.stats.summary.invalidate();
      toast.success("Usunięto urlop i przywrócono zajęcia");
      setDeletingId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const stats = data?.stats;
  const nextLabel = stats?.current
    ? `Trwa do ${format(new Date(`${stats.current.endDate}T00:00`), "d MMM", { locale: pl })}`
    : stats?.next
      ? formatVacationRange(stats.next.startDate, stats.next.endDate)
      : "Brak";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Urlopy</h1>
          <p className="text-muted-foreground text-sm">
            Zaplanuj wolne. Zajęcia w tym czasie zostaną automatycznie odwołane.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingVacation(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          Dodaj urlop
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={TreePalm}
          label="Dni urlopu w tym roku"
          value={String(stats?.daysThisYear ?? 0)}
          tone="primary"
        />
        <StatCard
          icon={CalendarRange}
          label={stats?.current ? "Obecny urlop" : "Najbliższy urlop"}
          value={nextLabel}
          tone="success"
          small
        />
        <StatCard
          icon={CalendarX2}
          label="Odwołane w tym roku"
          value={String(stats?.cancelledThisYear ?? 0)}
          tone="destructive"
        />
        <StatCard
          icon={BellRing}
          label="Do powiadomienia"
          value={String(stats?.toNotify ?? 0)}
          tone="warning"
        />
      </div>

      <div className="flex flex-col gap-3">
        {isLoading && <p className="text-muted-foreground text-sm">Ładowanie…</p>}
        {!isLoading && data?.vacations.length === 0 && (
          <Card className="items-center gap-2 py-12 text-center">
            <TreePalm className="text-muted-foreground size-8" />
            <p className="font-medium">Brak urlopów</p>
            <p className="text-muted-foreground text-sm">
              Dodaj urlop, a zajęcia w tym czasie odwołają się same.
            </p>
          </Card>
        )}
        {data?.vacations.map((vacation) => (
          <Card
            key={vacation.id}
            className={cn("gap-3 p-4", vacation.past && "opacity-60")}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <span className="font-semibold">
                  {formatVacationRange(vacation.startDate, vacation.endDate)}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">
                    {pluralize(vacation.days, "dzień", "dni", "dni")}
                  </Badge>
                  <Badge
                    variant={vacation.cancelledCount > 0 ? "destructive" : "outline"}
                  >
                    Odwołano{" "}
                    {pluralize(vacation.cancelledCount, "zajęcia", "zajęcia", "zajęć")}
                  </Badge>
                  {vacation.past && <Badge variant="outline">Zakończony</Badge>}
                </div>
                {vacation.note && (
                  <p className="text-muted-foreground text-sm">{vacation.note}</p>
                )}
              </div>
              <div className="flex items-center">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Edytuj urlop"
                  onClick={() => {
                    setEditingVacation(vacation);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Usuń urlop"
                  onClick={() => setDeletingId(vacation.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            {vacation.students.length > 0 && (
              <div className="flex flex-col gap-2">
                {vacation.students.map((student) => (
                  <div
                    key={student.studentId}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2",
                      student.notified
                        ? "border-success/30 bg-success/5"
                        : "border-warning/30 bg-warning/5",
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{student.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {student.lessons
                          .map((l) =>
                            format(new Date(l.startsAt), "EEE d.MM HH:mm", {
                              locale: pl,
                            }),
                          )
                          .join(", ")}
                      </span>
                      {student.phone && (
                        <a
                          href={`tel:${student.phone}`}
                          className="text-muted-foreground hover:text-foreground mt-0.5 flex w-fit items-center gap-1.5 text-xs"
                        >
                          <Phone className="size-3" />
                          {student.phone}
                        </a>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={student.notified ? "ghost" : "outline"}
                      disabled={setNotified.isPending}
                      onClick={() =>
                        setNotified.mutate({
                          vacationId: vacation.id,
                          studentId: student.studentId,
                          notified: !student.notified,
                        })
                      }
                    >
                      {student.notified ? (
                        <>
                          <Undo2 className="size-3.5" />
                          Cofnij
                        </>
                      ) : (
                        <>
                          <Check className="size-3.5" />
                          Odwołane
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <VacationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vacation={editingVacation}
      />

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(o) => !o && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć urlop?</AlertDialogTitle>
            <AlertDialogDescription>
              Zajęcia odwołane przez ten urlop wrócą do stanu „Zaplanowane”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteVacation.isPending}
              onClick={() => deletingId && deleteVacation.mutate({ id: deletingId })}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  small,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "primary" | "success" | "warning" | "destructive";
  small?: boolean;
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <Card className="gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md",
            toneClasses,
          )}
        >
          <Icon className="size-3.5" />
        </span>
      </div>
      <span className={cn("font-semibold tabular-nums", small ? "text-lg" : "text-2xl")}>
        {value}
      </span>
    </Card>
  );
}
