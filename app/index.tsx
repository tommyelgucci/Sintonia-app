import { useState } from "react";
import { Link } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { addCycleStart } from "@/lib/db";
import { pushCycleToCloud } from "@/lib/sync";
import { useCyclePrediction } from "@/lib/useCyclePrediction";
import type { CyclePhase } from "@/lib/cycle";

const PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual: "Menstrual",
  folicular: "Folicular",
  ovulacion: "Ovulación",
  lutea: "Lútea",
};

const PHASE_COLORS: Record<CyclePhase, string> = {
  menstrual: "#C2185B",
  folicular: "#7B61FF",
  ovulacion: "#00B8A9",
  lutea: "#F2994A",
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const { loading, prediction, isEstimated, hasAnyData, reload } = useCyclePrediction();
  const [saving, setSaving] = useState(false);

  async function markPeriodStartToday() {
    setSaving(true);
    try {
      const start = todayStr();
      await addCycleStart(start);
      await pushCycleToCloud({ startDate: start, periodLength: null });
      await reload();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#7B61FF" />
      </View>
    );
  }

  if (!hasAnyData || !prediction) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>Empecemos</Text>
        <Text style={styles.emptyBody}>
          Marcá el primer día de tu último período para que Sintonía pueda
          calcular tu fase y predecir el próximo.
        </Text>
        <Pressable style={styles.primaryButton} onPress={markPeriodStartToday} disabled={saving}>
          <Text style={styles.primaryButtonText}>
            {saving ? "Guardando..." : "Mi período empezó hoy"}
          </Text>
        </Pressable>
      </View>
    );
  }

  const phaseColor = PHASE_COLORS[prediction.phase];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.phaseCard, { backgroundColor: phaseColor }]}>
        <Text style={styles.phaseLabel}>{PHASE_LABELS[prediction.phase]}</Text>
        <Text style={styles.cycleDay}>Día {prediction.cycleDay} del ciclo</Text>
      </View>

      {isEstimated && (
        <Text style={styles.estimateNote}>
          Predicción estimada con un ciclo de 28 días — se ajusta sola a medida
          que registrás más períodos.
        </Text>
      )}

      <View style={styles.infoRow}>
        <InfoTile
          label="Próximo período"
          value={prediction.nextPeriodDate}
          sub={`en ${prediction.daysUntilNextPeriod} días`}
        />
        <InfoTile
          label="Ventana fértil"
          value={`${prediction.fertileWindowStart} — ${prediction.fertileWindowEnd}`}
        />
      </View>

      <Pressable style={styles.primaryButton} onPress={markPeriodStartToday} disabled={saving}>
        <Text style={styles.primaryButtonText}>
          {saving ? "Guardando..." : "Mi período empezó hoy"}
        </Text>
      </Pressable>

      <View style={styles.navRow}>
        <Link href="/log" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Registrar síntomas de hoy</Text>
          </Pressable>
        </Link>
        <Link href="/link" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Vincular pareja</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

function InfoTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
      {sub && <Text style={styles.tileSub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: "#2C1A4D" },
  emptyBody: { textAlign: "center", color: "#555", lineHeight: 20 },
  phaseCard: { borderRadius: 20, padding: 24, alignItems: "center" },
  phaseLabel: { fontSize: 28, fontWeight: "700", color: "#fff" },
  cycleDay: { fontSize: 16, color: "#fff", marginTop: 4, opacity: 0.9 },
  estimateNote: { fontSize: 12, color: "#888", textAlign: "center" },
  infoRow: { flexDirection: "row", gap: 12 },
  tile: { flex: 1, backgroundColor: "#F4F1FA", borderRadius: 14, padding: 14 },
  tileLabel: { fontSize: 12, color: "#7B61FF", fontWeight: "600" },
  tileValue: { fontSize: 15, fontWeight: "700", color: "#2C1A4D", marginTop: 4 },
  tileSub: { fontSize: 12, color: "#888", marginTop: 2 },
  primaryButton: {
    backgroundColor: "#2C1A4D",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  navRow: { flexDirection: "row", gap: 12 },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D8CFEF",
  },
  secondaryButtonText: { color: "#2C1A4D", fontWeight: "600", fontSize: 13 },
});
