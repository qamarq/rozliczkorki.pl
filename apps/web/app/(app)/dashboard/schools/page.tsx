"use client";

import Link from "next/link";
import { ChevronRight, MapPin, Phone, Plus, School, Wallet } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPayoutSchedule, formatPLN, pluralize } from "@repo/shared";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { SchoolDialog } from "./school-dialog";

export default function SchoolsPage() {
  const { data: schools = [], isLoading } = trpc.schools.list.useQuery({
    includeArchived: true,
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  const awaitingTotal = schools.reduce((sum, school) => sum + school.awaiting, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Szkółki</h1>
          <p className="text-muted-foreground text-sm">
            Placówki, w których uczysz, i przelewy, które od nich dostajesz.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Dodaj szkółkę
        </Button>
      </div>

      {schools.length > 0 && (
        <Card className="flex-row items-center gap-3 p-4">
          <span className="bg-warning/10 text-warning flex size-9 items-center justify-center rounded-lg">
            <Wallet className="size-4" />
          </span>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              Do wypłaty ze szkółek
            </span>
            <span className="text-xl font-semibold tabular-nums">
              {formatPLN(awaitingTotal)}
            </span>
          </div>
        </Card>
      )}

      {isLoading && <p className="text-muted-foreground text-sm">Ładowanie…</p>}

      {!isLoading && schools.length === 0 && (
        <Card className="items-center gap-2 py-12 text-center">
          <School className="text-muted-foreground size-8" />
          <p className="font-medium">Nie masz jeszcze żadnej szkółki</p>
          <p className="text-muted-foreground text-sm">
            Dodaj placówkę, a potem przypisz do niej uczniów — adres i rozliczenia pobiorą
            się automatycznie.
          </p>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => (
          <Link key={school.id} href={`/dashboard/schools/${school.id}`}>
            <Card
              className={cn(
                "hover:border-primary/40 h-full transition-colors",
                school.archived && "opacity-50",
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{school.name}</CardTitle>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="text-muted-foreground flex flex-col gap-1.5 text-sm">
                {school.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0" />
                    {school.address}
                  </span>
                )}
                {school.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5 shrink-0" />
                    {school.phone}
                  </span>
                )}
                <span className="text-xs">
                  {formatPayoutSchedule(school.payoutFrequency, school.payoutDay)}
                </span>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {pluralize(school.studentCount, "uczeń", "uczniów", "uczniów")}
                  </Badge>
                  {school.awaiting > 0 && (
                    <Badge className="bg-warning/10 text-warning border-warning/20">
                      {formatPLN(school.awaiting)} do wypłaty
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <SchoolDialog open={dialogOpen} onOpenChange={setDialogOpen} schoolId={null} />
    </div>
  );
}
