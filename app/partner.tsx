import { useEffect, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchPartnerCycles, fetchPartnerDailyLogs } from "@/lib/sync";
import { computeCycleStats, predictCycle } from "@/lib/cycle";
import type { CyclePhase, CyclePrediction } from "@/lib/cycle";
import type { DailyLog } from "@/lib/types";

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

export default function PartnerScreen() {
  const { partnerId, displayName } = useLocalSearchParams<{
    partnerId: string;
    displayName: string;
  }>();
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<CyclePrediction | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    if (!partnerId) return;
    Promise.all([fetchPartnerCycles(), fetchPartnerDailyLogs(partnerId)])
      .then(([allPartners, dailyLogs]) => {
        const mine = allPartners.find((p) => p.partnerId === partnerId);
        if (mine && mine.cycles.length > 0) {
          // fetchPartnerCycles no ordena en la query; hay que ordenar acá
          // antes de tomar el inicio más reciente (mismo criterio que
          // useCyclePrediction usa con los ciclos locales).
          const sorted = [...mine.cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
          const lastStart = sorted[sorted.length - 1].startDate;
          const stats = computeCycleStats(
            sorted.map((c) => ({ startDate: c.startDate, periodLength: c.periodLength ?? undefined }))
          );
          setPrediction(predictCycle(lastStart, todayStr(), stats));
        }
        setLogs(dailyLogs);
      })
      .finally(() => setLoading(false));
  }, [partnerId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#7B61FF" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: displayName || "Su ciclo" }} />

      {prediction ? (
        <View style={[styles.phaseCard, { backgroundColor: PHASE_COLORS[prediction.phase] }]}>
          <Text style={styles.phaseLabel}>{PHASE_LABELS[prediction.phase]}</Text>
          <Text style={styles.cycleDay}>Día {prediction.cycleDay} del ciclo</Text>
          <Text style={styles.sub}>
            Próximo período: {prediction.nextPeriodDate} (en {prediction.daysUntilNextPeriod} días)
          </Text>
          <Text style={styles.sub}>
            Ventana fértil: {prediction.fertileWindowStart} — {prediction.fertileWindowEnd}
          </Text>
        </View>
      ) : (
        <Text style={styles.emptyNote}>
          {displayName || "Esta persona"} todavía no comparte sus fechas de ciclo, o no registró
          ninguna.
        </Text>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimos registros</Text>
        {logs.length === 0 ? (
          <Text style={styles.emptyNote}>No hay síntomas ni ánimo compartidos todavía.</Text>
        ) : (
          logs.map((log) => (
            <View key={log.logDate} style={styles.logCard}>
              <Text style={styles.logDate}>{log.logDate}</Text>
              {log.symptoms.length > 0 && (
                <Text style={styles.logLine}>Síntomas: {log.symptoms.join(", ")}</Text>
              )}
              {log.mood.length > 0 && (
                <Text style={styles.logLine}>Ánimo: {log.mood.join(", ")}</Text>
              )}
              {log.symptoms.length === 0 && log.mood.length === 0 && (
                <Text style={styles.logLine}>Sin síntomas ni ánimo registrados.</Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 20 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  phaseCard: { borderRadius: 20, padding: 24, alignItems: "center", gap: 4 },
  phaseLabel: { fontSize: 24, fontWeight: "700", color: "#fff" },
  cycleDay: { fontSize: 14, color: "#fff", opacity: 0.9 },
  sub: { fontSize: 12, color: "#fff", opacity: 0.85 },
  emptyNote: { color: "#888", fontSize: 13, lineHeight: 18 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#2C1A4D" },
  logCard: { backgroundColor: "#F4F1FA", borderRadius: 14, padding: 14, gap: 4 },
  logDate: { fontSize: 12, fontWeight: "700", color: "#7B61FF" },
  logLine: { fontSize: 13, color: "#2C1A4D" },
});
