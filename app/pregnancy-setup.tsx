import { useEffect, useState } from "react";
import { goBackOrHome } from "@/lib/nav";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { confirmDestructive, notify } from "@/lib/notify";
import { getLatestCycleStart, getPregnancyLmp, setPregnancy, clearPregnancy } from "@/lib/db";
import { rescheduleReminders } from "@/lib/useReminders";
import { dueDateFromLmp, lmpFromDueDate, isValidIsoDate } from "@/lib/pregnancy";
import { formatDateEs } from "@/lib/format";
import { colors, radius, space, type } from "@/lib/theme";
import { Card, Eyebrow, FadeInView, PrimaryButton } from "@/lib/ui";

type DateMode = "lmp" | "dueDate";

export default function PregnancySetupScreen() {
  const [mode, setMode] = useState<DateMode>("lmp");
  const [dateInput, setDateInput] = useState("");
  const [alreadyActive, setAlreadyActive] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPregnancyLmp().then((lmp) => {
      if (lmp) {
        setAlreadyActive(true);
        setMode("lmp");
        setDateInput(lmp);
      }
    });
  }, []);

  async function useLastRegisteredPeriod() {
    const lastStart = await getLatestCycleStart();
    if (!lastStart) {
      notify("Sin datos", "Todavía no registraste ningún período.");
      return;
    }
    setMode("lmp");
    setDateInput(lastStart);
  }

  async function save() {
    if (!isValidIsoDate(dateInput)) {
      notify("Fecha inválida", "Escribila como AAAA-MM-DD, por ejemplo 2026-03-15.");
      return;
    }
    setSaving(true);
    try {
      await setPregnancy(mode === "lmp" ? dateInput : lmpFromDueDate(dateInput));
      // Entrar en modo embarazo apaga los avisos de ciclo.
      await rescheduleReminders();
      goBackOrHome();
    } finally {
      setSaving(false);
    }
  }

  function exitPregnancyMode() {
    confirmDestructive(
      "Salir del modo embarazo",
      "No se borra nada de lo que ya registraste, solo dejás de ver el progreso semanal.",
      async () => {
        await clearPregnancy();
        await rescheduleReminders();
        goBackOrHome();
      }
    );
  }

  const valid = isValidIsoDate(dateInput);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <FadeInView>
        <Eyebrow>Modo embarazo</Eyebrow>
        <Text style={[type.title, styles.pageTitle]}>Con una fecha alcanza</Text>
        <Text style={[type.body, { color: colors.inkSoft }]}>
          De una se calcula la otra. Podés cambiarla cuando quieras.
        </Text>
      </FadeInView>

      <Card index={1}>
        <Eyebrow>Qué fecha tenés</Eyebrow>
        <View style={styles.chipWrap}>
          <Chip
            label="Mi última menstruación"
            selected={mode === "lmp"}
            onPress={() => setMode("lmp")}
          />
          <Chip
            label="La fecha probable de parto"
            selected={mode === "dueDate"}
            onPress={() => setMode("dueDate")}
          />
        </View>

        <TextInput
          style={[styles.dateInput, type.body]}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={colors.inkFaint}
          value={dateInput}
          onChangeText={setDateInput}
        />

        {mode === "lmp" && (
          <Pressable onPress={useLastRegisteredPeriod}>
            <Text style={[type.label, { color: colors.clay, marginTop: space.md }]}>
              Usar mi último período registrado
            </Text>
          </Pressable>
        )}

        {valid && (
          <View style={styles.preview}>
            <Eyebrow>{mode === "lmp" ? "Fecha probable de parto" : "Última menstruación"}</Eyebrow>
            <Text style={[type.cardTitle, { color: colors.ink, marginTop: space.xs }]}>
              {formatDateEs(
                mode === "lmp" ? dueDateFromLmp(dateInput) : lmpFromDueDate(dateInput),
                true
              )}
            </Text>
          </View>
        )}
      </Card>

      <FadeInView index={2}>
        <PrimaryButton
          label={saving ? "Guardando..." : "Guardar"}
          onPress={save}
          disabled={saving}
        />
      </FadeInView>

      {alreadyActive && (
        <FadeInView index={3}>
          <Pressable
            onPress={exitPregnancyMode}
            style={({ pressed }) => [styles.exitButton, pressed && { opacity: 0.8 }]}
          >
            <Text style={[type.label, { color: colors.menstrual }]}>
              Salir del modo embarazo
            </Text>
          </Pressable>
        </FadeInView>
      )}
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
        pressed && { opacity: 0.82 },
      ]}
    >
      <Text style={[type.bodySmall, { color: selected ? colors.onDark : colors.inkSoft }]}>
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
  dateInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: space.md,
    marginTop: space.lg,
    color: colors.ink,
    letterSpacing: 1,
  },
  preview: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: space.lg,
    marginTop: space.lg,
  },
  exitButton: {
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
});
