"use client";

import { format } from "date-fns";
import { CalendarRange, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LESSON_MODE_LABELS, formatPLN, type LessonMode } from "@repo/shared";
import { trackStudentAdded } from "@repo/analytics";
import { flowDeps } from "@/lib/analytics";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
  ACTION,
  FIELD,
  FormCard,
  FormDialogContent,
  SELECT,
  Segmented,
} from "../form-ui";
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
    onSuccess: (created) => {
      const countAfter = (utils.students.list.getData()?.length ?? 0) + 1;
      void trackStudentAdded(flowDeps, { studentId: created.id, countAfter });
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

  const showAddress = !selectedSchool && defaultMode !== "remote";
  const today = format(new Date(), "yyyy-MM-dd");
  const currentRateId = student?.rates
    .filter((rate) => rate.effectiveFrom <= today)
    .sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? 1 : -1))[0]?.id;

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
      <FormDialogContent
        className="sm:max-w-xl"
        title={studentId ? "Edytuj ucznia" : "Nowy uczeń"}
        description={
          studentId
            ? "Kontakt, miejsce zajęć i historia stawek."
            : "Imię, stawka i miejsce zajęć. Resztę uzupełnisz później."
        }
        onSubmit={onSubmit}
        footer={
          <>
            {studentId ? (
              <Button
                type="button"
                variant="destructive"
                className={ACTION}
                onClick={() => deleteStudent.mutate({ id: studentId })}
              >
                <Trash2 data-icon="inline-start" />
                Usuń
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost" className={ACTION}>
                  Anuluj
                </Button>
              </DialogClose>
              <Button type="submit" className={ACTION}>
                {studentId ? "Zapisz" : "Dodaj ucznia"}
              </Button>
            </div>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormCard title="Uczeń">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Imię i nazwisko</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={FIELD}
              />
            </div>

            <div
              className={
                showAddress ? "grid gap-3 sm:grid-cols-2" : "flex flex-col gap-3"
              }
            >
              {showAddress && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="address">Adres</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="np. ul. Kwiatowa 5, Warszawa"
                    className={FIELD}
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
                  className={FIELD}
                />
              </div>
            </div>
          </FormCard>

          <FormCard title="Zajęcia">
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
                <SelectTrigger className={SELECT}>
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
              <Segmented
                label="Domyślna forma"
                value={defaultMode}
                onChange={setDefaultMode}
                options={(["in_person", "remote"] as const).map((value) => ({
                  value,
                  label: LESSON_MODE_LABELS[value],
                }))}
              />
            </div>

            {studentId && (
              <div className="bg-accent text-accent-foreground flex items-start gap-2 rounded-[10px] px-3 py-2 text-xs font-medium">
                <CalendarRange className="mt-px size-3.5 shrink-0" />
                Wydłużenie lub skrócenie cyklu zajęć: kliknij zajęcia w kalendarzu
              </div>
            )}
          </FormCard>

          {!studentId && (
            <FormCard title="Stawka">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="rate">Stawka za godzinę</Label>
                  <div className="relative">
                    <Input
                      id="rate"
                      type="number"
                      min={1}
                      step={1}
                      required
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className={cn(FIELD, "pr-12")}
                    />
                    <span className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                      zł/h
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="effectiveFrom">Obowiązuje od</Label>
                  <Input
                    id="effectiveFrom"
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className={FIELD}
                  />
                </div>
              </div>
            </FormCard>
          )}

          {studentId && student && (
            <FormCard title="Stawki">
              <ul className="divide-border -my-1 flex flex-col divide-y">
                {student.rates.map((rate) => (
                  <li
                    key={rate.id}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm"
                  >
                    <span className="text-muted-foreground">
                      od {format(new Date(rate.effectiveFrom), "dd.MM.yyyy")}
                    </span>
                    <span className="flex items-center gap-2">
                      {rate.id === currentRateId && (
                        <span className="bg-paid-soft text-success rounded-full px-2 py-0.5 text-xs font-semibold">
                          obecna
                        </span>
                      )}
                      <span className="font-semibold tabular-nums">
                        {formatPLN(Number(rate.hourlyRate))}/h
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-border flex flex-col gap-2 border-t pt-4">
                <span className="text-sm font-medium">Nowa stawka</span>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="relative min-w-28 flex-1">
                    <Input
                      id="newRate"
                      type="number"
                      min={1}
                      aria-label="Nowa stawka za godzinę"
                      placeholder="np. 90"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      className={cn(FIELD, "pr-12")}
                    />
                    <span className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                      zł/h
                    </span>
                  </div>
                  <Input
                    id="newRateDate"
                    type="date"
                    aria-label="Obowiązuje od"
                    value={newRateDate}
                    onChange={(e) => setNewRateDate(e.target.value)}
                    className={cn(FIELD, "min-w-36 flex-1")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className={ACTION}
                    onClick={onAddRate}
                  >
                    Dodaj
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  Wcześniejsze zajęcia zostaną rozliczone po starej stawce.
                </p>
              </div>
            </FormCard>
          )}

          {studentId && (
            <label
              htmlFor="archived"
              className="bg-card ring-foreground/10 flex cursor-pointer items-center justify-between gap-3 rounded-2xl p-4 ring-1 sm:px-5"
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Zarchiwizowany</span>
                <span className="text-muted-foreground text-xs">
                  Uczeń trafi do zakładki „Zarchiwizowani”.
                </span>
              </span>
              <Switch id="archived" checked={archived} onCheckedChange={setArchived} />
            </label>
          )}
        </div>
      </FormDialogContent>

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
