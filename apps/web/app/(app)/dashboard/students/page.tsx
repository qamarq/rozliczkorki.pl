"use client";

import { format } from "date-fns";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { formatPLN } from "@/lib/utils";
import { StudentDialog } from "./student-dialog";

export default function StudentsPage() {
  const { data: students = [], isLoading } = trpc.students.list.useQuery({
    includeArchived: true,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function openCreate() {
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Uczniowie</h1>
        <Button
          onClick={openCreate}
          className="bg-brand-gradient text-white hover:opacity-90"
        >
          Dodaj ucznia
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Ładowanie…</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {students.map((student) => (
          <Card
            key={student.id}
            className={student.archived ? "opacity-50" : ""}
            onClick={() => openEdit(student.id)}
            role="button"
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{student.name}</CardTitle>
                <Badge variant={student.type === "private" ? "default" : "secondary"}>
                  {student.type === "private" ? "korki" : "szkółka"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-muted-foreground flex flex-col gap-1 text-sm">
              {student.address && <span>{student.address}</span>}
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

function RateSummary({ studentId }: { studentId: string }) {
  const { data } = trpc.students.byId.useQuery({ id: studentId });
  const currentRate = data?.rates[0];
  if (!currentRate) return null;
  return (
    <span>
      {formatPLN(Number(currentRate.hourlyRate))}/h od{" "}
      {format(new Date(currentRate.effectiveFrom), "dd.MM.yyyy")}
    </span>
  );
}
