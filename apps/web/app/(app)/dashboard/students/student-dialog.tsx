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
import { LESSON_MODE_LABELS, formatPLN, type LessonMode } from "@repo/shared";
import { trpc } from "@/lib/trpc/client";
import { SchoolDialog } from "../schools/school-dialog";

const PRIVATE = "private";
const ADD_SCHOOL = "__add_school__";

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
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolTouched, setSchoolTouched] = useState(false);
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
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
      setSchoolId(student.schoolId);
      setSchoolTouched(false);
      setDefaultMode(student.defaultMode);
      setArchived(student.archived);
    } else {
      setName("");
      setAddress("");
      setPhone("");
      setSchoolId(null);
      setSchoolTouched(false);
      setDefaultMode("in_person");
      setArchived(false);
      setHourlyRate(80);
      setEffectiveFrom(format(new Date(), "yyyy-MM-dd"));
    }
    setNewRate("");
    setNewRateDate(format(new Date(), "yyyy-MM-dd"));
  }, [open, student]);

  const { data: schools = [] } = trpc.schools.list.useQuery(undefined, {
    enabled: open,
  });
  const selectedSchool = schools.find((school) => school.id === schoolId) ?? null;
  // Pre-schools student: typed as "school" but not pointing at a school yet.
  const unassignedSchool = !schoolId && student?.type === "school";

  const invalidate = () => {
    utils.students.list.invalidate();
    utils.schools.list.invalidate();
    utils.schools.byId.invalidate();
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
        address: schoolId ? null : address,
        phone,
        // Keep the legacy school flag until the user actually picks from the select.
        ...(unassignedSchool && !schoolTouched ? {} : { schoolId }),
        defaultMode,
        archived,
      });
      onOpenChange(false);
      return;
    }
    createStudent.mutate({
      name,
      address: schoolId ? undefined : address,
      phone,
      schoolId,
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

          {(() => {
            const showAddress = !selectedSchool && defaultMode !== "remote";
            return (
              <div
                className={showAddress ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}
              >
                {showAddress && (
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
            );
          })()}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Gdzie uczysz</Label>
              <Select
                value={schoolId ?? PRIVATE}
                onValueChange={(value) => {
                  if (value === ADD_SCHOOL) {
                    setSchoolDialogOpen(true);
                    return;
                  }
                  setSchoolTouched(true);
                  setSchoolId(value === PRIVATE ? null : value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PRIVATE}>Prywatnie</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={ADD_SCHOOL}>+ Dodaj nową szkółkę</SelectItem>
                </SelectContent>
              </Select>
              {selectedSchool && (
                <p className="text-muted-foreground text-xs">
                  Adres zajęć: {selectedSchool.address ?? "uzupełnij go w szkółce"}
                </p>
              )}
              {unassignedSchool && !schoolTouched && (
                <p className="text-warning text-xs">
                  Ten uczeń był oznaczony jako zajęcia w szkółce. Wybierz placówkę, żeby
                  śledzić przelewy, albo zostaw prywatnie.
                </p>
              )}
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

      <SchoolDialog
        open={schoolDialogOpen}
        onOpenChange={setSchoolDialogOpen}
        schoolId={null}
        onCreated={(id) => {
          setSchoolTouched(true);
          setSchoolId(id);
        }}
      />
    </Dialog>
  );
}
