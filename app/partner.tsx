import { useEffect, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchPartnerCycles, fetchPartnerDailyLogs } from "@/lib/sync";
import { computeCycleStats, predictCycle } from "@/lib/cycle";
import { formatDateEs } from "@/lib/format";
import { colors, radius, space, type } from "@/lib/theme";
import { Card, Eyebrow, FadeInView, HeroCard, ProgressBar } from "@/lib/ui";
import type { CyclePhase, CyclePrediction } from "@/lib/cycle";
import type { DailyLog } from "@/lib/types";

const PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual: "Menstrual",
  folicular: "Folicular",
  ovulacion: "Ovulación",
  lutea: "Lútea",
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
          // antes de tomar el inicio más reciente.
          const sorted = [...mine.cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
          const stats = computeCycleStats(
            sorted.map((c) => ({
              startDate: c.startDate,
              periodLength: c.periodLength ?? undefined,
            }))
          );
          setPrediction(predictCycle(sorted[sorted.length - 1].startDate, todayStr(), stats));
        }
        setLogs(dailyLogs);
      })
      .finally(() => setLoading(false));
  }, [partnerId]);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.clay} />
      </View>
    );
  }

  const cycleLength = prediction
    ? prediction.cycleDay + prediction.daysUntilNextPeriod
    : 0;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ title: displayName || "Su ciclo" }} />

      {prediction ? (
        <HeroCard gradient={colors.gradients[prediction.phase]}>
          <Eyebrow tone="onDark">{displayName || "Su ciclo"}</Eyebrow>
          <Text style={[type.hero, styles.heroTitle]}>{PHASE_LABELS[prediction.phase]}</Text>
          <Text style={[type.body, { color: colors.onDarkSoft }]}>
            Día {prediction.cycleDay} del ciclo
          </Text>
          <View style={styles.heroSpacer} />
          <ProgressBar
            ratio={prediction.cycleDay / Math.max(cycleLength, 1)}
            label={`Día ${prediction.cycleDay} de ~${cycleLength}`}
          />
        </HeroCard>
      ) : (
        <Card>
          <Text style={[type.body, { color: colors.inkSoft }]}>
            {displayName || "Esta persona"} todavía no comparte sus fechas de ciclo, o no
            registró ninguna.
          </Text>
        </Card>
      )}

      {prediction && (
        <FadeInView index={1}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Eyebrow>Próximo período</Eyebrow>
              <Text style={[type.cardTitle, styles.statValue]}>
                {formatDateEs(prediction.nextPeriodDate)}
              </Text>
              <Text style={[type.bodySmall, { color: colors.inkFaint }]}>
                en {prediction.daysUntilNextPeriod} días
              </Text>
            </View>
            <View style={styles.stat}>
              <Eyebrow>Ventana fértil</Eyebrow>
              <Text style={[type.cardTitle, styles.statValue]}>
                {formatDateEs(prediction.fertileWindowStart)}
              </Text>
              <Text style={[type.bodySmall, { color: colors.inkFaint }]}>
                al {formatDateEs(prediction.fertileWindowEnd)}
              </Text>
            </View>
          </View>
        </FadeInView>
      )}

      <FadeInView index={2}>
        <Eyebrow>Últimos registros</Eyebrow>
      </FadeInView>

      {logs.length === 0 ? (
        <Card index={3}>
          <Text style={[type.body, { color: colors.inkSoft }]}>
            No hay síntomas ni ánimo compartidos todavía. Cada persona elige qué
            comparte, por conexión.
          </Text>
        </Card>
      ) : (
        logs.map((log, i) => (
          <Card key={log.logDate} index={3 + i}>
            <Eyebrow>{formatDateEs(log.logDate)}</Eyebrow>
            {log.symptoms.length > 0 && (
              <Text style={[type.body, styles.logLine]}>{log.symptoms.join(" · ")}</Text>
            )}
            {log.mood.length > 0 && (
              <Text style={[type.bodySmall, { color: colors.inkSoft }]}>
                {log.mood.join(" · ")}
              </Text>
            )}
            {log.symptoms.length === 0 && log.mood.length === 0 && (
              <Text style={[type.bodySmall, { color: colors.inkFaint }]}>
                Sin síntomas ni ánimo registrados.
              </Text>
            )}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: space.lg,
    gap: space.md,
    paddingBottom: space.xxl,
    backgroundColor: colors.canvas,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { color: colors.onDark, marginTop: space.sm },
  heroSpacer: { height: space.xl },
  statRow: { flexDirection: "row", gap: space.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: space.lg,
  },
  statValue: { color: colors.ink, marginTop: space.sm },
  logLine: { color: colors.ink, marginTop: space.xs },
});
