"use client";

import { format } from "date-fns";
import { CalendarRange } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { LESSON_MODE_LABELS, type LessonMode } from "@/lib/lessons";
import { trpc } from "@/lib/trpc/client";
import { formatPLN } from "@/lib/utils";

type StudentType = "private" | "school";

export function StudentDialog({
  open,
  onOpenChange,
  studentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
}) {
  const utils = trpc.useUtils();
  const { data: student } = trpc.students.byId.useQuery(
    { id: studentId ?? "" },
    { enabled: !!studentId },
  );

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<StudentType>("private");
  const [defaultMode, setDefaultMode] = useState<LessonMode>("in_person");
  const [archived, setArchived] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(80);
  const [effectiveFrom, setEffectiveFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newRate, setNewRate] = useState("");
  const [newRateDate, setNewRateDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (!open) return;
    if (student) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(student.name);
      setAddress(student.address ?? "");
      setPhone(student.phone ?? "");
      setType(student.type);
      setDefaultMode(student.defaultMode);
      setArchived(student.archived);
    } else {
      setName("");
      setAddress("");
      setPhone("");
      setType("private");
      setDefaultMode("in_person");
      setArchived(false);
      setHourlyRate(80);
      setEffectiveFrom(format(new Date(), "yyyy-MM-dd"));
    }
    setNewRate("");
    setNewRateDate(format(new Date(), "yyyy-MM-dd"));
  }, [open, student]);

  const invalidate = () => {
    utils.students.list.invalidate();
    utils.students.byId.invalidate();
    utils.lessons.range.invalidate();
    utils.recurring.list.invalidate();
    utils.stats.summary.invalidate();
    utils.stats.analytics.invalidate();
  };

  const createStudent = trpc.students.create.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Dodano ucznia");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStudent = trpc.students.update.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Zapisano");
    },
    onError: (e) => toast.error(e.message),
  });

  const addRate = trpc.students.addRate.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Dodano nową stawkę");
      setNewRate("");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteStudent = trpc.students.delete.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Usunięto ucznia");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (studentId) {
      updateStudent.mutate({
        id: studentId,
        name,
        address,
        phone,
        type,
        defaultMode,
        archived,
      });
      onOpenChange(false);
      return;
    }
    createStudent.mutate({
      name,
      address,
      phone,
      type,
      defaultMode,
      hourlyRate,
      effectiveFrom,
    });
  }

  function onAddRate() {
    if (!studentId || !newRate) return;
    addRate.mutate({
      studentId,
      hourlyRate: Number(newRate),
      effectiveFrom: newRateDate,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{studentId ? "Edytuj ucznia" : "Nowy uczeń"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Imię i nazwisko</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div
            className={
              defaultMode === "remote" ? "flex flex-col gap-3" : "grid grid-cols-2 gap-3"
            }
          >
            {defaultMode !== "remote" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="np. ul. Kwiatowa 5, Warszawa"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Telefon (opcjonalnie)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="np. 601 234 567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Typ zajęć</Label>
              <Select value={type} onValueChange={(v) => setType(v as StudentType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Korki prywatne</SelectItem>
                  <SelectItem value="school">Zajęcia w szkółce</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Domyślna forma</Label>
              <Select
                value={defaultMode}
                onValueChange={(v) => setDefaultMode(v as LessonMode)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["in_person", "remote"] as const).map((m) => (
                    <SelectItem key={m} value={m}>
                      {LESSON_MODE_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {studentId && (
            <div className="bg-primary/10 text-primary flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <CalendarRange className="size-3.5" />
              Wydłużenie lub skrócenie cyklu zajęć: kliknij zajęcia w kalendarzu
            </div>
          )}

          {!studentId && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="rate">Stawka za godzinę</Label>
                <Input
                  id="rate"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="effectiveFrom">Obowiązuje od</Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  required
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                />
              </div>
            </div>
          )}

          {studentId && (
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="archived">Zarchiwizowany</Label>
              <Switch id="archived" checked={archived} onCheckedChange={setArchived} />
            </div>
          )}

          {studentId && student && (
            <>
              <Separator />
              <div className="flex flex-col gap-2">
                <Label>Historia stawek</Label>
                <div className="flex flex-col gap-1 text-sm">
                  {student.rates.map((rate) => (
                    <div
                      key={rate.id}
                      className="text-muted-foreground flex justify-between"
                    >
                      <span>od {format(new Date(rate.effectiveFrom), "dd.MM.yyyy")}</span>
                      <span>{formatPLN(Number(rate.hourlyRate))}/h</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-2">
                    <Label htmlFor="newRate">Nowa stawka</Label>
                    <Input
                      id="newRate"
                      type="number"
                      min={1}
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label htmlFor="newRateDate">Od</Label>
                    <Input
                      id="newRateDate"
                      type="date"
                      value={newRateDate}
                      onChange={(e) => setNewRateDate(e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={onAddRate}>
                    Dodaj
                  </Button>
                </div>
              </div>
            </>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            {studentId ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => deleteStudent.mutate({ id: studentId })}
              >
                Usuń
              </Button>
            ) : (
              <span />
            )}
            <Button
              type="submit"
              className="bg-brand-gradient text-white hover:opacity-90"
            >
              {studentId ? "Zapisz" : "Dodaj"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
