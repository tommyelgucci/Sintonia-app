import { useCallback, useState } from "react";
import { Link, useFocusEffect } from "expo-router";
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
import { usePregnancy } from "@/lib/usePregnancy";
import { getWeekContent } from "@/lib/pregnancyContent";
import type { CyclePhase } from "@/lib/cycle";
import type { Trimester } from "@/lib/pregnancy";

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

const TRIMESTER_LABELS: Record<Trimester, string> = {
  primero: "Primer trimestre",
  segundo: "Segundo trimestre",
  tercero: "Tercer trimestre",
};

const TRIMESTER_COLORS: Record<Trimester, string> = {
  primero: "#7B61FF",
  segundo: "#5B4B9A",
  tercero: "#2C1A4D",
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const cycle = useCyclePrediction();
  const pregnancy = usePregnancy();
  const [saving, setSaving] = useState(false);

  // index.tsx es la pantalla raíz: nunca se desmonta al navegar a log/link/
  // pregnancy-setup y volver, así que el useEffect de cada hook no se
  // vuelve a disparar solo. Sin esto, activar el modo embarazo y volver
  // seguía mostrando el estado de ciclo viejo.
  useFocusEffect(
    useCallback(() => {
      cycle.reload();
      pregnancy.reload();
    }, [cycle.reload, pregnancy.reload])
  );

  async function markPeriodStartToday() {
    setSaving(true);
    try {
      const start = todayStr();
      await addCycleStart(start);
      await pushCycleToCloud({ startDate: start, periodLength: null });
      await cycle.reload();
    } finally {
      setSaving(false);
    }
  }

  if (cycle.loading || pregnancy.loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#7B61FF" />
      </View>
    );
  }

  if (pregnancy.progress) {
    const { week, dayOfWeek, trimester, dueDate, daysUntilDueDate } = pregnancy.progress;
    const content = getWeekContent(week);
    const trimesterColor = TRIMESTER_COLORS[trimester];

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.phaseCard, { backgroundColor: trimesterColor }]}>
          <Text style={styles.phaseLabel}>
            Semana {week}{dayOfWeek > 0 ? ` + ${dayOfWeek} días` : ""}
          </Text>
          <Text style={styles.cycleDay}>{TRIMESTER_LABELS[trimester]}</Text>
        </View>

        <View style={styles.infoRow}>
          <InfoTile
            label="Fecha probable de parto"
            value={dueDate}
            sub={daysUntilDueDate >= 0 ? `en ${daysUntilDueDate} días` : "ya pasó la fecha"}
          />
          <InfoTile label="Tu bebé es del tamaño de" value={content.sizeComparison} />
        </View>

        <View style={styles.weekContentCard}>
          <Text style={styles.weekContentText}>{content.blurb}</Text>
        </View>

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

        <Link href="/pregnancy-setup" asChild>
          <Pressable>
            <Text style={styles.linkText}>Editar fecha o salir del modo embarazo</Text>
          </Pressable>
        </Link>
      </ScrollView>
    );
  }

  if (!cycle.hasAnyData || !cycle.prediction) {
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
        <Link href="/pregnancy-setup" asChild>
          <Pressable>
            <Text style={styles.linkText}>¿Estás embarazada?</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const { prediction, isEstimated } = cycle;
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

      <Link href="/pregnancy-setup" asChild>
        <Pressable>
          <Text style={styles.linkText}>¿Estás embarazada?</Text>
        </Pressable>
      </Link>
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
  weekContentCard: { backgroundColor: "#F4F1FA", borderRadius: 14, padding: 16 },
  weekContentText: { color: "#2C1A4D", fontSize: 14, lineHeight: 20 },
  linkText: { color: "#7B61FF", fontSize: 13, fontWeight: "600", textAlign: "center" },
});
