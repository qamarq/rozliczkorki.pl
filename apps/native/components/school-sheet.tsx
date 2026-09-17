import { format } from "date-fns";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Chip,
  DateTimeField,
  GradientButton,
  Input,
  OutlineButton,
  SectionLabel,
} from "@/components/ui";
import { alert } from "@/lib/alert";
import {
  PAYOUT_DAY_HINTS,
  PAYOUT_FREQUENCIES,
  PAYOUT_FREQUENCY_LABELS,
  type PayoutFrequency,
  WEEKDAY_NAMES,
} from "@repo/shared";
import { closeSheet, openSheet } from "@/lib/sheet";
import { colors } from "@/lib/theme";
import { trpc } from "@/lib/trpc";

export function openSchoolSheet(schoolId?: string, onCreated?: (id: string) => void) {
  openSheet(() => (
    <SchoolForm schoolId={schoolId} onClose={closeSheet} onCreated={onCreated} />
  ));
}

function SchoolForm({
  schoolId,
  onClose,
  onCreated,
}: {
  schoolId?: string;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const utils = trpc.useUtils();
  const { data: school } = trpc.schools.byId.useQuery(
    { id: schoolId ?? "" },
    { enabled: !!schoolId },
  );

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<PayoutFrequency>("monthly");
  const [payoutDay, setPayoutDay] = useState("10");
  const [payoutAnchor, setPayoutAnchor] = useState(() => new Date());

  useEffect(() => {
    if (!school) return;
    setName(school.name);
    setAddress(school.address ?? "");
    setPhone(school.phone ?? "");
    setContactName(school.contactName ?? "");
    setEmail(school.email ?? "");
    setFrequency(school.payoutFrequency);
    setPayoutDay(school.payoutDay == null ? "" : String(school.payoutDay));
    if (school.payoutAnchor) setPayoutAnchor(new Date(`${school.payoutAnchor}T12:00:00`));
  }, [school]);

  function invalidate() {
    utils.schools.list.invalidate();
    utils.schools.byId.invalidate();
    utils.students.list.invalidate();
  }

  const createSchool = trpc.schools.create.useMutation({
    onSuccess: (created) => {
      invalidate();
      onClose();
      if (created) onCreated?.(created.id);
    },
    onError: (e) => alert("Błąd", e.message),
  });

  const updateSchool = trpc.schools.update.useMutation({
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (e) => alert("Błąd", e.message),
  });

  const deleteSchool = trpc.schools.delete.useMutation({
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (e) => alert("Błąd", e.message),
  });

  function onSave() {
    if (!name.trim()) {
      alert("Uzupełnij dane", "Podaj nazwę szkółki.");
      return;
    }
    const payload = {
      name: name.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
      contactName: contactName.trim() || null,
      email: email.trim() || null,
      payoutFrequency: frequency,
      payoutDay:
        frequency === "per_lesson" || payoutDay === "" ? null : Number(payoutDay),
      payoutAnchor: frequency === "biweekly" ? format(payoutAnchor, "yyyy-MM-dd") : null,
    };
    if (schoolId) updateSchool.mutate({ id: schoolId, ...payload });
    else createSchool.mutate(payload);
  }

  function onDelete() {
    if (!schoolId) return;
    alert(
      "Usunąć szkółkę?",
      "Uczniowie zostaną zachowani, ale wrócą do rozliczeń prywatnych, a historia przelewów zniknie.",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: () => deleteSchool.mutate({ id: schoolId }),
        },
      ],
    );
  }

  return (
    <View style={styles.content}>
      <Text style={styles.title}>{schoolId ? "Edytuj szkółkę" : "Nowa szkółka"}</Text>

      <Input label="Nazwa szkółki" value={name} onChangeText={setName} />
      <Input label="Lokalizacja" value={address} onChangeText={setAddress} />
      <Input label="Osoba kontaktowa" value={contactName} onChangeText={setContactName} />
      <Input
        label="Telefon"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <Input
        label="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <SectionLabel>Jak często wypłacają</SectionLabel>
      <View style={styles.chipRow}>
        {PAYOUT_FREQUENCIES.map((f) => (
          <Chip
            key={f}
            label={PAYOUT_FREQUENCY_LABELS[f]}
            active={frequency === f}
            onPress={() => setFrequency(f)}
          />
        ))}
      </View>
      <Text style={styles.hint}>{PAYOUT_DAY_HINTS[frequency]}</Text>

      {frequency === "monthly" && (
        <Input
          label="Wypłata do dnia miesiąca"
          keyboardType="numeric"
          value={payoutDay}
          onChangeText={setPayoutDay}
        />
      )}

      {(frequency === "weekly" || frequency === "biweekly") && (
        <>
          <SectionLabel>Dzień wypłaty</SectionLabel>
          <View style={styles.chipRow}>
            {WEEKDAY_NAMES.map((day, index) => (
              <Chip
                key={day}
                label={day.slice(0, 3)}
                active={payoutDay === String(index)}
                onPress={() => setPayoutDay(String(index))}
              />
            ))}
          </View>
        </>
      )}

      {frequency === "biweekly" && (
        <DateTimeField
          label="Pierwszy okres rozliczeniowy od"
          mode="date"
          value={payoutAnchor}
          onChange={setPayoutAnchor}
        />
      )}

      <View style={{ marginTop: 12, gap: 10 }}>
        <GradientButton
          label="Zapisz"
          onPress={onSave}
          loading={createSchool.isPending || updateSchool.isPending}
        />
        {schoolId ? (
          <OutlineButton
            label="Usuń szkółkę"
            tone="danger"
            onPress={onDelete}
            disabled={deleteSchool.isPending}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  title: { fontSize: 20, fontWeight: "800", color: colors.text },
  hint: { fontSize: 12, color: colors.textFaint, marginTop: -6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
