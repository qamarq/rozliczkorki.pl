import { format } from "date-fns";
import { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge, Card, Chip, GradientButton, Input, OutlineButton } from "@/components/ui";
import { formatPLN } from "@/lib/format";
import { colors } from "@/lib/theme";
import { trpc } from "@/lib/trpc";

export default function StudentsScreen() {
  const utils = trpc.useUtils();
  const { data: students = [], isLoading, refetch } = trpc.students.list.useQuery();

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<"private" | "school">("private");
  const [hourlyRate, setHourlyRate] = useState("80");

  const createStudent = trpc.students.create.useMutation({
    onSuccess: () => {
      utils.students.list.invalidate();
      setFormOpen(false);
      setName("");
      setAddress("");
      setHourlyRate("80");
      setType("private");
    },
    onError: (e) => Alert.alert("Błąd", e.message),
  });

  function onSubmit() {
    if (!name || !hourlyRate) return;
    createStudent.mutate({
      name,
      address: address || undefined,
      type,
      hourlyRate: Number(hourlyRate),
      effectiveFrom: format(new Date(), "yyyy-MM-dd"),
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        onRefresh={refetch}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Badge
                label={item.type === "private" ? "korki" : "szkółka"}
                tone={item.type === "private" ? "default" : "success"}
              />
            </View>
            {item.address && <Text style={styles.cardSubtitle}>{item.address}</Text>}
            <RateSummary studentId={item.id} />
          </Card>
        )}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 8 }}>
            <Text style={styles.header}>Uczniowie</Text>
            {!formOpen && (
              <OutlineButton label="+ Dodaj ucznia" onPress={() => setFormOpen(true)} />
            )}
            {formOpen && (
              <Card style={styles.form}>
                <Input label="Imię i nazwisko" value={name} onChangeText={setName} />
                <Input
                  label="Adres (opcjonalnie)"
                  value={address}
                  onChangeText={setAddress}
                />
                <View style={styles.typeRow}>
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
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <OutlineButton label="Anuluj" onPress={() => setFormOpen(false)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <GradientButton
                      label="Zapisz"
                      onPress={onSubmit}
                      loading={createStudent.isPending}
                    />
                  </View>
                </View>
              </Card>
            )}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>Brak uczniów</Text> : null
        }
      />
    </SafeAreaView>
  );
}

function RateSummary({ studentId }: { studentId: string }) {
  const { data } = trpc.students.byId.useQuery({ id: studentId });
  const currentRate = data?.rates[0];
  if (!currentRate) return null;
  return (
    <Text style={styles.rateText}>
      {formatPLN(Number(currentRate.hourlyRate))}/h od{" "}
      {format(new Date(currentRate.effectiveFrom), "dd.MM.yyyy")}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { fontSize: 24, fontWeight: "800", color: colors.text },
  list: { padding: 20, gap: 10 },
  card: { marginBottom: 8, gap: 4 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  cardSubtitle: { fontSize: 13, color: colors.textMuted },
  rateText: { fontSize: 13, color: colors.textFaint, marginTop: 2 },
  form: { gap: 10 },
  typeRow: { flexDirection: "row", gap: 8 },
  empty: { textAlign: "center", color: colors.textFaint, marginTop: 40 },
});
