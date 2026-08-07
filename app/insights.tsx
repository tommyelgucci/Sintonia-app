import { useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useInsights } from "@/lib/useInsights";
import { colors, radius, space, type } from "@/lib/theme";
import { Card, Eyebrow, FadeInView, ProgressBar, QuietButton } from "@/lib/ui";
import type { CycleLengthPoint, FrequencyCount } from "@/lib/insights";

export default function InsightsScreen() {
  const router = useRouter();
  const { loading, insights, reload } = useInsights();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  if (loading || !insights) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.clay} />
      </View>
    );
  }

  if (insights.cycleCount === 0) {
    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <Eyebrow>Estadísticas</Eyebrow>
          <Text style={[type.title, styles.pageTitle]}>Todavía no hay nada que mostrar</Text>
          <Text style={[type.body, { color: colors.inkSoft }]}>
            En cuanto registres un período, acá vas a ver la tendencia de tus ciclos y
            qué tan seguido registrás.
          </Text>
        </FadeInView>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <FadeInView>
        <Eyebrow>Estadísticas</Eyebrow>
        <Text style={[type.title, styles.pageTitle]}>Tu ciclo en números</Text>
        <Text style={[type.body, { color: colors.inkSoft }]}>
          A partir de {insights.cycleCount} {insights.cycleCount === 1 ? "ciclo registrado" : "ciclos registrados"}.
        </Text>
      </FadeInView>

      <Card index={1}>
        <Eyebrow>Promedio</Eyebrow>
        <View style={styles.statRow}>
          <Stat
            label="Duración del ciclo"
            value={insights.avgCycleLength !== null ? `${insights.avgCycleLength} días` : "—"}
            sub={
              insights.minCycleLength !== null
                ? `entre ${insights.minCycleLength} y ${insights.maxCycleLength}`
                : "hace falta un segundo ciclo"
            }
          />
          <Stat
            label="Duración del período"
            value={insights.avgPeriodLength !== null ? `${insights.avgPeriodLength} días` : "—"}
            sub={insights.avgPeriodLength !== null ? undefined : "sin datos cargados"}
          />
        </View>
      </Card>

      {insights.cycleLengthHistory.length > 0 && (
        <Card index={2}>
          <Eyebrow>Últimos ciclos</Eyebrow>
          <Text style={[type.bodySmall, { color: colors.inkFaint, marginTop: space.xs }]}>
            Días entre un período y el siguiente.
          </Text>
          <CycleLengthChart points={insights.cycleLengthHistory} avg={insights.avgCycleLength} />
        </Card>
      )}

      {(insights.topSymptoms.length > 0 ||
        insights.topMoods.length > 0 ||
        insights.topDischargeSigns.length > 0) && (
        <Card index={3}>
          <Eyebrow>Lo más frecuente</Eyebrow>
          {insights.topSymptoms.length > 0 && (
            <FrequencyList title="Síntomas" items={insights.topSymptoms} />
          )}
          {insights.topMoods.length > 0 && (
            <FrequencyList title="Ánimo" items={insights.topMoods} />
          )}
          {insights.topDischargeSigns.length > 0 && (
            <FrequencyList title="Flujo vaginal" items={insights.topDischargeSigns} />
          )}
        </Card>
      )}

      <Card index={4}>
        <Eyebrow>Constancia</Eyebrow>
        <Text style={[type.section, styles.cardHeading]}>
          {Math.round(insights.loggingRate * 100)}% de los días registrados
        </Text>
        <Text style={[type.body, { color: colors.inkSoft, marginBottom: space.md }]}>
          {insights.loggedDaysCount} de {insights.trackedDaysCount} días desde tu primer
          período cargado.
        </Text>
        <ProgressBar ratio={insights.loggingRate} tone="ink" />
      </Card>

      <FadeInView index={5}>
        <QuietButton
          label="Ver reporte para el médico"
          onPress={() => router.push("/health-report")}
        />
      </FadeInView>
    </ScrollView>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.stat}>
      <Eyebrow>{label}</Eyebrow>
      <Text style={[type.cardTitle, { color: colors.ink, marginTop: space.sm }]}>{value}</Text>
      {sub && <Text style={[type.bodySmall, { color: colors.inkFaint }]}>{sub}</Text>}
    </View>
  );
}

/**
 * Barras dibujadas a mano con Views, no una librería de gráficos: es un
 * solo gráfico simple en toda la app, y sumar una dependencia (con su
 * propio motor de render) para esto sería más código que el que ahorra.
 * La altura de cada barra es relativa al máximo del set, no a una escala
 * fija, para que la diferencia entre ciclos se note incluso si todos
 * están cerca del promedio.
 */
function CycleLengthChart({ points, avg }: { points: CycleLengthPoint[]; avg: number | null }) {
  const max = Math.max(...points.map((p) => p.length), avg ?? 0);
  const min = Math.min(...points.map((p) => p.length));
  const barMinHeight = 6;
  const barMaxHeight = 96;

  function heightFor(length: number): number {
    if (max === min) return barMaxHeight;
    const ratio = (length - min) / (max - min);
    return barMinHeight + ratio * (barMaxHeight - barMinHeight);
  }

  return (
    <View style={styles.chart}>
      {points.map((point) => (
        <View key={point.startDate} style={styles.barColumn}>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.bar,
                {
                  height: heightFor(point.length),
                  backgroundColor:
                    avg !== null && Math.abs(point.length - avg) > 7 ? colors.clay : colors.folicular,
                },
              ]}
            />
          </View>
          <Text style={[type.bodySmall, styles.barLabel]}>{point.length}</Text>
        </View>
      ))}
    </View>
  );
}

function FrequencyList({ title, items }: { title: string; items: FrequencyCount[] }) {
  const max = Math.max(...items.map((i) => i.count));
  return (
    <View style={styles.freqGroup}>
      <Text style={[type.label, { color: colors.inkSoft, marginBottom: space.sm }]}>{title}</Text>
      {items.map((item) => (
        <View key={item.label} style={styles.freqRow}>
          <Text style={[type.bodySmall, styles.freqLabel]}>{item.label}</Text>
          <View style={styles.freqTrack}>
            <View
              style={[styles.freqFill, { width: `${(item.count / max) * 100}%` }]}
            />
          </View>
          <Text style={[type.bodySmall, { color: colors.inkFaint }]}>{item.count}</Text>
        </View>
      ))}
    </View>
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
  pageTitle: { color: colors.ink, marginTop: space.xs, marginBottom: space.xs },
  cardHeading: { color: colors.ink, marginTop: space.xs },
  statRow: { flexDirection: "row", gap: space.md, marginTop: space.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: space.lg,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.sm,
    marginTop: space.lg,
  },
  barColumn: { flex: 1, alignItems: "center", gap: space.xs },
  barTrack: { height: 96, justifyContent: "flex-end" },
  bar: { width: 14, borderRadius: radius.pill },
  barLabel: { color: colors.inkFaint },
  freqGroup: { marginTop: space.md },
  freqRow: { flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.sm },
  freqLabel: { color: colors.inkSoft, width: 108 },
  freqTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
  },
  freqFill: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.clay },
});
