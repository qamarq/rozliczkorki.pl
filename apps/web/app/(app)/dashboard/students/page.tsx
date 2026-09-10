"use client";

import { format } from "date-fns";
import { MapPin, Phone, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import { cn, formatPLN } from "@/lib/utils";
import { StudentDialog } from "./student-dialog";

type Filter = "active" | "archived" | "all";

export default function StudentsPage() {
  const { data: students = [], isLoading } = trpc.students.list.useQuery({
    includeArchived: true,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("active");

  function openCreate() {
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setDialogOpen(true);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (filter === "active" && s.archived) return false;
      if (filter === "archived" && !s.archived) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q)
      );
    });
  }, [students, query, filter]);

  const activeCount = students.filter((s) => !s.archived).length;
  const archivedCount = students.filter((s) => s.archived).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Uczniowie i stawki</h1>
          <p className="text-muted-foreground text-sm">
            Lista uczniów, kontakt i aktualne stawki godzinowe.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Dodaj ucznia
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj po imieniu, adresie, telefonie…"
            className="pl-9"
          />
        </div>
        <div className="bg-secondary flex items-center gap-1 rounded-lg p-1">
          <FilterTab active={filter === "active"} onClick={() => setFilter("active")}>
            Aktywni ({activeCount})
          </FilterTab>
          <FilterTab
            active={filter === "archived"}
            onClick={() => setFilter("archived")}
          >
            Zarchiwizowani ({archivedCount})
          </FilterTab>
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")}>
            Wszyscy ({students.length})
          </FilterTab>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Ładowanie…</p>}

      {!isLoading && filtered.length === 0 && (
        <Card className="items-center gap-2 py-12 text-center">
          <Users className="text-muted-foreground size-8" />
          <p className="font-medium">Brak uczniów do wyświetlenia</p>
          <p className="text-muted-foreground text-sm">
            {query ? "Zmień zapytanie albo filtr." : "Dodaj pierwszego ucznia, żeby zacząć."}
          </p>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((student) => (
          <Card
            key={student.id}
            className={cn(
              "hover:border-primary/50 cursor-pointer transition-colors",
              student.archived && "opacity-50",
            )}
            onClick={() => openEdit(student.id)}
            role="button"
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{student.name}</CardTitle>
                <Badge
                  className={
                    student.type === "private"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-accent text-accent-foreground"
                  }
                >
                  {student.type === "private" ? "korki" : "szkółka"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-muted-foreground flex flex-col gap-1.5 text-sm">
              {student.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  {student.address}
                </span>
              )}
              {student.phone && (
                <a
                  href={`tel:${student.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-foreground flex items-center gap-1.5"
                >
                  <Phone className="size-3.5 shrink-0" />
                  {student.phone}
                </a>
              )}
              <RateSummary studentId={student.id} />
            </CardContent>
          </Card>
        ))}
      </div>

      <StudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        studentId={editingId}
      />
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function RateSummary({ studentId }: { studentId: string }) {
  const { data } = trpc.students.byId.useQuery({ id: studentId });
  const currentRate = data?.rates[0];
  if (!currentRate) return null;
  return (
    <span className="text-foreground font-medium tabular-nums">
      {formatPLN(Number(currentRate.hourlyRate))}/h{" "}
      <span className="text-muted-foreground font-normal">
        od {format(new Date(currentRate.effectiveFrom), "dd.MM.yyyy")}
      </span>
    </span>
  );
}
