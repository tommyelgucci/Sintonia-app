import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getLatestCycleStart, getPregnancyLmp, setPregnancy, clearPregnancy } from "@/lib/db";
import { dueDateFromLmp, lmpFromDueDate, isValidIsoDate } from "@/lib/pregnancy";

type DateMode = "lmp" | "dueDate";

// Alert.alert es un no-op en react-native-web (node_modules/react-native-web
// no lo implementa) — un diálogo de confirmación con acción destructiva
// nunca se dispararía en web. window.confirm es el único equivalente
// disponible ahí; en nativo seguimos usando el Alert de siempre.
function confirmDestructive(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancelar", style: "cancel" },
    { text: "Salir", style: "destructive", onPress: onConfirm },
  ]);
}

export default function PregnancySetupScreen() {
  const router = useRouter();
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
      Alert.alert("No hay ningún período registrado todavía.");
      return;
    }
    setMode("lmp");
    setDateInput(lastStart);
  }

  async function save() {
    if (!isValidIsoDate(dateInput)) {
      Alert.alert("Fecha inválida", "Escribila como AAAA-MM-DD, por ejemplo 2026-03-15.");
      return;
    }
    setSaving(true);
    try {
      const lmpDate = mode === "lmp" ? dateInput : lmpFromDueDate(dateInput);
      await setPregnancy(lmpDate);
      router.back();
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
        router.back();
      }
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.body}>
        Con cualquiera de las dos fechas alcanza — de una se calcula la otra.
      </Text>

      <View style={styles.chipRow}>
        <Chip
          label="Sé mi última menstruación"
          selected={mode === "lmp"}
          onPress={() => setMode("lmp")}
        />
        <Chip
          label="Sé la fecha probable de parto"
          selected={mode === "dueDate"}
          onPress={() => setMode("dueDate")}
        />
      </View>

      <TextInput
        style={styles.dateInput}
        placeholder="AAAA-MM-DD"
        value={dateInput}
        onChangeText={setDateInput}
      />

      {mode === "lmp" && (
        <Pressable onPress={useLastRegisteredPeriod}>
          <Text style={styles.linkText}>Usar mi último período registrado</Text>
        </Pressable>
      )}

      {isValidIsoDate(dateInput) && (
        <Text style={styles.previewText}>
          {mode === "lmp"
            ? `Fecha probable de parto: ${dueDateFromLmp(dateInput)}`
            : `Última menstruación estimada: ${lmpFromDueDate(dateInput)}`}
        </Text>
      )}

      <Pressable style={styles.primaryButton} onPress={save} disabled={saving}>
        <Text style={styles.primaryButtonText}>
          {saving ? "Guardando..." : "Guardar"}
        </Text>
      </Pressable>

      {alreadyActive && (
        <Pressable style={styles.exitButton} onPress={exitPregnancyMode}>
          <Text style={styles.exitButtonText}>Salir del modo embarazo</Text>
        </Pressable>
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
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  body: { color: "#555", fontSize: 13, lineHeight: 18 },
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
  dateInput: {
    borderWidth: 1,
    borderColor: "#D8CFEF",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    letterSpacing: 1,
  },
  linkText: { color: "#7B61FF", fontSize: 13, fontWeight: "600" },
  previewText: { color: "#555", fontSize: 13 },
  primaryButton: {
    backgroundColor: "#2C1A4D",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  exitButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C2185B",
  },
  exitButtonText: { color: "#C2185B", fontWeight: "600", fontSize: 13 },
});
