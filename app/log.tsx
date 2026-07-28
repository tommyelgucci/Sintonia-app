import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getDailyLog, upsertDailyLog } from "@/lib/db";
import type { FlowIntensity } from "@/lib/types";

const FLOW_OPTIONS: { value: FlowIntensity; label: string }[] = [
  { value: "none", label: "Nada" },
  { value: "light", label: "Leve" },
  { value: "medium", label: "Medio" },
  { value: "heavy", label: "Abundante" },
];

const SYMPTOM_OPTIONS = [
  "Cólicos",
  "Dolor de cabeza",
  "Hinchazón",
  "Fatiga",
  "Acné",
  "Dolor de espalda",
  "Sensibilidad en pechos",
];

const MOOD_OPTIONS = ["Tranquila", "Irritable", "Ansiosa", "Con energía", "Triste", "Sensible"];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function LogScreen() {
  const router = useRouter();
  const logDate = todayStr();
  const [flow, setFlow] = useState<FlowIntensity>("none");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDailyLog(logDate).then((existing) => {
      if (!existing) return;
      setFlow(existing.flow);
      setSymptoms(existing.symptoms);
      setMood(existing.mood);
      setNotes(existing.notes ?? "");
    });
  }, [logDate]);

  async function save() {
    setSaving(true);
    try {
      await upsertDailyLog({ logDate, flow, symptoms, mood, notes: notes || null });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.dateLabel}>{logDate}</Text>

      <Section title="Flujo">
        <View style={styles.chipRow}>
          {FLOW_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={flow === opt.value}
              onPress={() => setFlow(opt.value)}
            />
          ))}
        </View>
      </Section>

      <Section title="Síntomas">
        <View style={styles.chipRow}>
          {SYMPTOM_OPTIONS.map((s) => (
            <Chip
              key={s}
              label={s}
              selected={symptoms.includes(s)}
              onPress={() => setSymptoms(toggle(symptoms, s))}
            />
          ))}
        </View>
      </Section>

      <Section title="Ánimo">
        <View style={styles.chipRow}>
          {MOOD_OPTIONS.map((m) => (
            <Chip
              key={m}
              label={m}
              selected={mood.includes(m)}
              onPress={() => setMood(toggle(mood, m))}
            />
          ))}
        </View>
      </Section>

      <Section title="Notas">
        <TextInput
          style={styles.notesInput}
          placeholder="Algo más que quieras anotar..."
          multiline
          value={notes}
          onChangeText={setNotes}
        />
      </Section>

      <Pressable style={styles.saveButton} onPress={save} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? "Guardando..." : "Guardar"}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 20 },
  dateLabel: { fontSize: 13, color: "#888", fontWeight: "600" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#2C1A4D" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#D8CFEF",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipSelected: { backgroundColor: "#7B61FF", borderColor: "#7B61FF" },
  chipText: { color: "#2C1A4D", fontSize: 13 },
  chipTextSelected: { color: "#fff", fontWeight: "600" },
  notesInput: {
    borderWidth: 1,
    borderColor: "#D8CFEF",
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#2C1A4D",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
