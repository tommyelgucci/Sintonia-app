import { useEffect, useState } from "react";
import { goBackOrHome } from "@/lib/nav";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { getDailyLog, upsertDailyLog } from "@/lib/db";
import { pushDailyLogToCloud } from "@/lib/sync";
import { formatDateEs } from "@/lib/format";
import { colors, radius, space, type } from "@/lib/theme";
import { Card, Eyebrow, FadeInView, PrimaryButton } from "@/lib/ui";
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
  "Náuseas",
];

/**
 * Los ánimos van con un tinte propio en vez de todos iguales: le da a la
 * grilla algo para leer de un vistazo y saca la sensación de formulario.
 * Los tonos son los de la paleta, desaturados — nada de rojo alarma para
 * "irritable", que sería exactamente el juicio que la app no quiere hacer.
 */
const MOOD_OPTIONS: { label: string; tint: string }[] = [
  { label: "Tranquila", tint: "#E1E9DD" },
  { label: "Con energía", tint: "#F5E7D2" },
  { label: "Sensible", tint: "#EFE1E8" },
  { label: "Irritable", tint: "#F0E2DA" },
  { label: "Ansiosa", tint: "#E8E0EA" },
  { label: "Triste", tint: "#DFE3E9" },
];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function LogScreen() {
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
      const log = { logDate, flow, symptoms, mood, notes: notes || null };
      await upsertDailyLog(log);
      await pushDailyLogToCloud(log);
      goBackOrHome();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <FadeInView>
        <Eyebrow>Hoy</Eyebrow>
        <Text style={[type.title, styles.pageTitle]}>{formatDateEs(logDate)}</Text>
        <Text style={[type.bodySmall, { color: colors.inkSoft }]}>
          Registrá lo que quieras. No hace falta completar todo.
        </Text>
      </FadeInView>

      <Card index={1}>
        <Eyebrow>Flujo</Eyebrow>
        <View style={styles.chipWrap}>
          {FLOW_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={flow === opt.value}
              onPress={() => setFlow(opt.value)}
            />
          ))}
        </View>
      </Card>

      <Card index={2}>
        <Eyebrow>Síntomas físicos</Eyebrow>
        <View style={styles.chipWrap}>
          {SYMPTOM_OPTIONS.map((s) => (
            <Chip
              key={s}
              label={s}
              selected={symptoms.includes(s)}
              onPress={() => setSymptoms(toggle(symptoms, s))}
            />
          ))}
        </View>
      </Card>

      <Card index={3}>
        <Eyebrow>Hoy me siento</Eyebrow>
        <View style={styles.moodGrid}>
          {MOOD_OPTIONS.map((m) => {
            const selected = mood.includes(m.label);
            return (
              <Pressable
                key={m.label}
                onPress={() => setMood(toggle(mood, m.label))}
                style={({ pressed }) => [
                  styles.moodCard,
                  { backgroundColor: m.tint },
                  selected && styles.moodCardSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    type.label,
                    { color: colors.ink },
                    selected && { fontFamily: "Karla_700Bold" },
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card index={4}>
        <Eyebrow>Notas</Eyebrow>
        <Text style={[type.bodySmall, { color: colors.inkFaint, marginTop: space.xs }]}>
          Queda en tu dispositivo. Nadie más lo lee.
        </Text>
        <TextInput
          style={[styles.notesInput, type.body]}
          placeholder="Escribilo con libertad..."
          placeholderTextColor={colors.inkFaint}
          multiline
          value={notes}
          onChangeText={setNotes}
        />
      </Card>

      <FadeInView index={5}>
        <PrimaryButton
          label={saving ? "Guardando..." : "Guardar"}
          onPress={save}
          disabled={saving}
        />
      </FadeInView>
    </ScrollView>
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
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          type.bodySmall,
          { color: selected ? colors.onDark : colors.inkSoft },
          selected && { fontFamily: "Karla_500Medium" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: space.lg,
    gap: space.md,
    paddingBottom: space.xxl,
    backgroundColor: colors.canvas,
  },
  pageTitle: { color: colors.ink, marginTop: space.xs, marginBottom: space.xs },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: space.lg,
  },
  chipSelected: { backgroundColor: colors.clay, borderColor: colors.clay },
  moodGrid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.md },
  moodCard: {
    // Tres por fila con los gaps descontados; el flexBasis en porcentaje
    // mantiene la grilla pareja en pantallas angostas.
    flexBasis: "31%",
    flexGrow: 1,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  moodCardSelected: { borderColor: colors.clay },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: space.md,
    minHeight: 96,
    marginTop: space.md,
    color: colors.ink,
    textAlignVertical: "top",
  },
  pressed: { opacity: 0.82 },
});
