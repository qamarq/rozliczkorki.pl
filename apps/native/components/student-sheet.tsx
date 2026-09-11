import { format } from "date-fns";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Chip,
  GradientButton,
  Input,
  OutlineButton,
  SectionLabel,
} from "@/components/ui";
import { alert } from "@/lib/alert";
import { formatPLN } from "@/lib/format";
import { closeSheet, openSheet } from "@/lib/sheet";
import { colors } from "@/lib/theme";
import { trpc } from "@/lib/trpc";

export function openStudentSheet(studentId?: string) {
  openSheet(() => <StudentForm studentId={studentId} onClose={closeSheet} />);
}

function StudentForm({
  studentId,
  onClose,
}: {
  studentId?: string;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const { data: student } = trpc.students.byId.useQuery(
    { id: studentId ?? "" },
    { enabled: !!studentId },
  );

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<"private" | "school">("private");
  const [hourlyRate, setHourlyRate] = useState("80");

  const currentRate = student?.rates[0];

  useEffect(() => {
    if (!student) return;
    setName(student.name);
    setAddress(student.address ?? "");
    setPhone(student.phone ?? "");
    setType(student.type);
    if (student.rates[0]) setHourlyRate(String(Number(student.rates[0].hourlyRate)));
  }, [student]);

  function invalidate() {
    utils.students.list.invalidate();
    if (studentId) utils.students.byId.invalidate({ id: studentId });
    utils.lessons.range.invalidate();
    utils.stats.summary.invalidate();
  }

  const createStudent = trpc.students.create.useMutation({
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (e) => alert("Błąd", e.message),
  });

  const updateStudent = trpc.students.update.useMutation({
    onError: (e) => alert("Błąd", e.message),
  });

  const addRate = trpc.students.addRate.useMutation({
    onError: (e) => alert("Błąd", e.message),
  });

  const deleteStudent = trpc.students.delete.useMutation({
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (e) => alert("Błąd", e.message),
  });

  const isSaving =
    createStudent.isPending || updateStudent.isPending || addRate.isPending;

  async function onSave() {
    const rate = Number(hourlyRate.replace(",", "."));
    if (!name.trim() || !Number.isFinite(rate) || rate <= 0) {
      alert("Uzupełnij dane", "Podaj imię i nazwisko oraz poprawną stawkę.");
      return;
    }

    if (!studentId) {
      createStudent.mutate({
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        type,
        hourlyRate: rate,
        effectiveFrom: format(new Date(), "yyyy-MM-dd"),
      });
      return;
    }

    await updateStudent.mutateAsync({
      id: studentId,
      name: name.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
      type,
    });

    if (!currentRate || Number(currentRate.hourlyRate) !== rate) {
      await addRate.mutateAsync({
        studentId,
        hourlyRate: rate,
        effectiveFrom: format(new Date(), "yyyy-MM-dd"),
      });
    }

    invalidate();
    onClose();
  }

  function onDelete() {
    if (!studentId) return;
    alert(
      "Usunąć ucznia?",
      "Usunięcie ucznia skasuje też powiązane z nim zajęcia. Tej operacji nie da się cofnąć.",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: () => deleteStudent.mutate({ id: studentId }),
        },
      ],
    );
  }

  return (
    <View style={styles.content}>
      <Text style={styles.title}>{studentId ? "Edytuj ucznia" : "Nowy uczeń"}</Text>

      <Input label="Imię i nazwisko" value={name} onChangeText={setName} />
      <Input label="Adres (opcjonalnie)" value={address} onChangeText={setAddress} />
      <Input
        label="Telefon (opcjonalnie)"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <SectionLabel>Typ</SectionLabel>
      <View style={styles.chipRow}>
        <Chip
          label="Korki"
          active={type === "private"}
          onPress={() => setType("private")}
        />
        <Chip
          label="Szkółka"
          active={type === "school"}
          onPress={() => setType("school")}
        />
      </View>

      <Input
        label="Stawka za godzinę (PLN)"
        keyboardType="numeric"
        value={hourlyRate}
        onChangeText={setHourlyRate}
      />
      {currentRate ? (
        <Text style={styles.hint}>
          Obecna stawka: {formatPLN(Number(currentRate.hourlyRate))}/h od{" "}
          {format(new Date(currentRate.effectiveFrom), "dd.MM.yyyy")}. Zmiana zacznie
          obowiązywać od dziś.
        </Text>
      ) : null}

      <View style={{ marginTop: 12, gap: 10 }}>
        <GradientButton label="Zapisz" onPress={onSave} loading={isSaving} />
        {studentId ? (
          <OutlineButton
            label="Usuń ucznia"
            tone="danger"
            onPress={onDelete}
            disabled={deleteStudent.isPending}
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
