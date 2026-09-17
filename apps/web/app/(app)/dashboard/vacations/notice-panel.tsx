"use client";

import type { AppRouter } from "@repo/api";
import type { inferRouterOutputs } from "@trpc/server";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Check, Phone, PhoneOff, TreePalm } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pluralize } from "@repo/shared";
import { trpc } from "@/lib/trpc/client";

type PendingNotice =
  inferRouterOutputs<AppRouter>["vacations"]["overview"]["pending"][number];

export function useSetNotified() {
  const utils = trpc.useUtils();
  return trpc.vacations.setNotified.useMutation({
    onSuccess: () => utils.vacations.overview.invalidate(),
  });
}

export function VacationNoticesPanel({ pending }: { pending: PendingNotice[] }) {
  const setNotified = useSetNotified();

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TreePalm className="text-warning size-4" />
          <h2 className="text-sm font-semibold">Do odwołania (urlop)</h2>
        </div>
        <Badge variant="secondary">{pending.length}</Badge>
      </div>
      {pending.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Wszyscy uczniowie wiedzą o odwołanych zajęciach.
        </p>
      )}
      <div className="flex flex-col gap-2">
        {pending.map((notice) => (
          <div
            key={`${notice.vacationId}-${notice.studentId}`}
            className="border-warning/30 bg-warning/5 flex flex-col gap-2 rounded-lg border px-3 py-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{notice.name}</span>
                <span className="text-muted-foreground text-xs">
                  {pluralize(notice.lessons.length, "zajęcia", "zajęcia", "zajęć")}:{" "}
                  {notice.lessons
                    .map((l) =>
                      format(new Date(l.startsAt), "EEE d.MM HH:mm", { locale: pl }),
                    )
                    .join(", ")}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={setNotified.isPending}
                onClick={() =>
                  setNotified.mutate({
                    vacationId: notice.vacationId,
                    studentId: notice.studentId,
                    notified: true,
                  })
                }
              >
                <Check className="size-3.5" />
                Odwołane
              </Button>
            </div>
            {notice.phone ? (
              <a
                href={`tel:${notice.phone}`}
                className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-xs"
              >
                <Phone className="size-3.5" />
                {notice.phone}
              </a>
            ) : (
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <PhoneOff className="size-3.5" />
                Brak numeru telefonu
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
