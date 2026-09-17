"use client";

import { format } from "date-fns";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  PAYOUT_DAY_HINTS,
  PAYOUT_FREQUENCIES,
  PAYOUT_FREQUENCY_LABELS,
  type PayoutFrequency,
  WEEKDAY_NAMES,
} from "@repo/shared";
import { trpc } from "@/lib/trpc/client";

export function SchoolDialog({
  open,
  onOpenChange,
  schoolId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string | null;
  onCreated?: (id: string) => void;
}) {
  const utils = trpc.useUtils();
  const { data: school } = trpc.schools.byId.useQuery(
    { id: schoolId ?? "" },
    { enabled: !!schoolId && open },
  );

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<PayoutFrequency>("monthly");
  const [payoutDay, setPayoutDay] = useState("10");
  const [payoutAnchor, setPayoutAnchor] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [archived, setArchived] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (schoolId && school) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(school.name);
      setAddress(school.address ?? "");
      setPhone(school.phone ?? "");
      setContactName(school.contactName ?? "");
      setEmail(school.email ?? "");
      setFrequency(school.payoutFrequency);
      setPayoutDay(school.payoutDay == null ? "" : String(school.payoutDay));
      setPayoutAnchor(school.payoutAnchor ?? format(new Date(), "yyyy-MM-dd"));
      setNotes(school.notes ?? "");
      setArchived(school.archived);
    } else if (!schoolId) {
      setName("");
      setAddress("");
      setPhone("");
      setContactName("");
      setEmail("");
      setFrequency("monthly");
      setPayoutDay("10");
      setPayoutAnchor(format(new Date(), "yyyy-MM-dd"));
      setNotes("");
      setArchived(false);
    }
  }, [open, schoolId, school]);

  const invalidate = () => {
    utils.schools.list.invalidate();
    utils.schools.byId.invalidate();
    utils.students.list.invalidate();
  };

  const createSchool = trpc.schools.create.useMutation({
    onSuccess: (created) => {
      invalidate();
      toast.success("Dodano szkółkę");
      onOpenChange(false);
      if (created) onCreated?.(created.id);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateSchool = trpc.schools.update.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Zapisano");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      address: address || null,
      phone: phone || null,
      contactName: contactName || null,
      email: email || null,
      payoutFrequency: frequency,
      payoutDay:
        frequency === "per_lesson" || payoutDay === "" ? null : Number(payoutDay),
      payoutAnchor: frequency === "biweekly" ? payoutAnchor : null,
      notes: notes || null,
    };
    if (schoolId) updateSchool.mutate({ id: schoolId, ...payload, archived });
    else createSchool.mutate(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{schoolId ? "Edytuj szkółkę" : "Nowa szkółka"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="school-name">Nazwa szkółki</Label>
            <Input
              id="school-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Szkoła Językowa Lingua"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="school-address">Lokalizacja</Label>
            <Input
              id="school-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="np. ul. Szkolna 12, Warszawa"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="school-contact">Osoba kontaktowa</Label>
              <Input
                id="school-contact"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="school-phone">Telefon</Label>
              <Input
                id="school-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="school-email">E-mail</Label>
            <Input
              id="school-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Jak często wypłacają</Label>
              <Select
                value={frequency}
                onValueChange={(v) => setFrequency(v as PayoutFrequency)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYOUT_FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {PAYOUT_FREQUENCY_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {frequency === "monthly" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="payout-day">Wypłata do dnia</Label>
                <Input
                  id="payout-day"
                  type="number"
                  min={1}
                  max={31}
                  value={payoutDay}
                  onChange={(e) => setPayoutDay(e.target.value)}
                />
              </div>
            )}

            {(frequency === "weekly" || frequency === "biweekly") && (
              <div className="flex flex-col gap-2">
                <Label>Dzień wypłaty</Label>
                <Select value={payoutDay} onValueChange={setPayoutDay}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Wybierz dzień" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAY_NAMES.map((day, index) => (
                      <SelectItem key={day} value={String(index)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <p className="text-muted-foreground -mt-2 text-xs">
            {PAYOUT_DAY_HINTS[frequency]}
          </p>

          {frequency === "biweekly" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="payout-anchor">Pierwszy okres rozliczeniowy od</Label>
              <Input
                id="payout-anchor"
                type="date"
                value={payoutAnchor}
                onChange={(e) => setPayoutAnchor(e.target.value)}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="school-notes">Notatki</Label>
            <Textarea
              id="school-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {schoolId && (
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="school-archived">Zarchiwizowana</Label>
              <Switch
                id="school-archived"
                checked={archived}
                onCheckedChange={setArchived}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              className="bg-brand-gradient text-white hover:opacity-90"
              disabled={createSchool.isPending || updateSchool.isPending}
            >
              {schoolId ? "Zapisz" : "Dodaj szkółkę"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
