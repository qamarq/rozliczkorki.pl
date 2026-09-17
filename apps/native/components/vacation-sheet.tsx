import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Badge,
  Chip,
  DateTimeField,
  GradientButton,
  Input,
  SectionLabel,
} from "@/components/ui";
import { alert } from "@/lib/alert";
import { localDayRange, pluralize } from "@repo/shared";
import { closeSheet, openSheet } from "@/lib/sheet";
import { colors } from "@/lib/theme";
import { trpc } from "@/lib/trpc";

export type EditableVacation = {
  id: string;
  startDate: string;
  endDate: string;
  note: string | null;
};

export function openVacationSheet(vacation?: EditableVacation) {
  openSheet(() => <VacationForm vacation={vacation} onClose={closeSheet} />);
}

function VacationForm({
  vacation,
  onClose,
}: {
  vacation?: EditableVacation;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const today = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(vacation?.startDate ?? today);
  const [endDate, setEndDate] = useState(vacation?.endDate ?? today);
  const [note, setNote] = useState(vacation?.note ?? "");
  const [keepIds, setKeepIds] = useState<string[]>([]);

  const rangeInput = { startDate, endDate, ...localDayRange(startDate, endDate) };
  const { data: preview, isFetching } = trpc.vacations.preview.useQuery({
    ...rangeInput,
    vacationId: vacation?.id,
  });
  const affected = preview?.toCancel ?? [];
  const restoreCount = preview?.restoreCount ?? 0;
  const remoteLessons = affected.filter((l) => l.mode === "remote");
  const cancelCount = affected.filter((l) => !keepIds.includes(l.id)).length;

  const onSaved = () => {
    utils.vacations.overview.invalidate();
    utils.lessons.range.invalidate();
    utils.stats.summary.invalidate();
    utils.stats.analytics.invalidate();
    onClose();
  };

  const createVacation = trpc.vacations.create.useMutation({
    onSuccess: onSaved,
    onError: (e) => alert("Błąd", e.message),
  });

  const updateVacation = trpc.vacations.update.useMutation({
    onSuccess: onSaved,
    onError: (e) => alert("Błąd", e.message),
  });

  function onSave() {
    const payload = {
      ...rangeInput,
      note: note.trim() || undefined,
      keepLessonIds: keepIds.filter((id) => remoteLessons.some((l) => l.id === id)),
    };
    if (vacation) {
      updateVacation.mutate({ ...payload, id: vacation.id });
    } else {
      createVacation.mutate(payload);
    }
  }

  return (
    <View style={styles.content}>
      <Text style={styles.title}>{vacation ? "Edytuj urlop" : "Nowy urlop"}</Text>

      <DateTimeField
        label="Od"
        mode="date"
        value={new Date(`${startDate}T00:00`)}
        onChange={(date) => {
          const picked = format(date, "yyyy-MM-dd");
          setStartDate(picked);
          if (endDate < picked) setEndDate(picked);
        }}
      />
      <DateTimeField
        label="Do"
        mode="date"
        value={new Date(`${endDate}T00:00`)}
        onChange={(date) => {
          const picked = format(date, "yyyy-MM-dd");
          setEndDate(picked < startDate ? startDate : picked);
        }}
      />
      <Input
        label="Notatka (opcjonalnie)"
        placeholder="np. wyjazd w góry"
        value={note}
        onChangeText={setNote}
      />

      {!isFetching && (
        <View style={styles.chipRow}>
          <Badge
            label={
              cancelCount > 0
                ? `Odwoła ${pluralize(cancelCount, "zajęcia", "zajęcia", "zajęć")}`
                : vacation
                  ? "Brak nowych zajęć do odwołania"
                  : "Brak zajęć do odwołania"
            }
            tone={cancelCount > 0 ? "danger" : "default"}
          />
          {restoreCount > 0 && (
            <Badge
              label={`Przywróci ${pluralize(restoreCount, "zajęcia", "zajęcia", "zajęć")}`}
            />
          )}
          {keepIds.length > 0 && (
            <Badge
              label={`Zachowa ${pluralize(keepIds.length, "zajęcia online", "zajęcia online", "zajęć online")}`}
              tone="success"
            />
          )}
        </View>
      )}

      {remoteLessons.length > 0 && (
        <>
          <SectionLabel>Zajęcia online w tym czasie</SectionLabel>
          <Text style={styles.hint}>Zaznacz te, które chcesz zachować mimo urlopu.</Text>
          <View style={styles.chipRow}>
            {remoteLessons.map((lesson) => {
              const kept = keepIds.includes(lesson.id);
              return (
                <Chip
                  key={lesson.id}
                  label={`${format(new Date(lesson.startsAt), "EEE d.MM HH:mm", { locale: pl })} · ${lesson.studentName}`}
                  active={kept}
                  onPress={() =>
                    setKeepIds((ids) =>
                      kept ? ids.filter((id) => id !== lesson.id) : [...ids, lesson.id],
                    )
                  }
                />
              );
            })}
          </View>
        </>
      )}

      <View style={{ marginTop: 12 }}>
        <GradientButton
          label={vacation ? "Zapisz" : "Dodaj urlop"}
          onPress={onSave}
          loading={createVacation.isPending || updateVacation.isPending}
        />
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
