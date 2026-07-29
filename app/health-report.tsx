import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { notify } from "@/lib/notify";
import { listCycles, listDailyLogs } from "@/lib/db";
import { buildHealthReport, type HealthReportData } from "@/lib/healthReport";
import { buildHealthReportHtml } from "@/lib/healthReportHtml";
import { exportHealthReport, PopupBlockedError } from "@/lib/healthReportExport";
import { colors, radius, space, type } from "@/lib/theme";
import { Card, Eyebrow, FadeInView, PrimaryButton } from "@/lib/ui";
import { ShieldIcon } from "@/lib/icons";

const RANGE_OPTIONS = [3, 6, 12];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HealthReportScreen() {
  const [rangeMonths, setRangeMonths] = useState(6);
  const [report, setReport] = useState<HealthReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([listCycles(), listDailyLogs()])
      .then(([cycles, logs]) => {
        setReport(buildHealthReport(cycles, logs, rangeMonths, todayStr()));
      })
      .finally(() => setLoading(false));
  }, [rangeMonths]);

  async function handleExport() {
    if (!report) return;
    setExporting(true);
    try {
      await exportHealthReport(buildHealthReportHtml(report, todayStr()));
    } catch (err) {
      if (err instanceof PopupBlockedError) {
        notify("No se pudo abrir el reporte", err.message);
      } else {
        notify("Error", "No se pudo generar el reporte. Intentá de nuevo.");
      }
    } finally {
      setExporting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <FadeInView>
        <Eyebrow>Reporte</Eyebrow>
        <Text style={[type.title, styles.pageTitle]}>Para llevar a la consulta</Text>
        <Text style={[type.body, { color: colors.inkSoft }]}>
          Un resumen de tus ciclos en una hoja: duración promedio, variación y los
          síntomas más frecuentes.
        </Text>
      </FadeInView>

      <FadeInView index={1}>
        <View style={styles.privacyRow}>
          <ShieldIcon size={18} color={colors.folicular} />
          <Text style={[type.bodySmall, { color: colors.inkSoft, flex: 1 }]}>
            Se arma en tu dispositivo. No pasa por ningún servidor.
          </Text>
        </View>
      </FadeInView>

      <Card index={2}>
        <Eyebrow>Período a incluir</Eyebrow>
        <View style={styles.chipWrap}>
          {RANGE_OPTIONS.map((months) => (
            <Pressable
              key={months}
              onPress={() => setRangeMonths(months)}
              style={({ pressed }) => [
                styles.chip,
                rangeMonths === months && styles.chipSelected,
                pressed && { opacity: 0.82 },
              ]}
            >
              <Text
                style={[
                  type.bodySmall,
                  { color: rangeMonths === months ? colors.onDark : colors.inkSoft },
                ]}
              >
                {months} meses
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {loading || !report ? (
        <Text style={[type.body, styles.stateText]}>Calculando...</Text>
      ) : report.cycleCount === 0 ? (
        <Card index={3}>
          <Text style={[type.body, { color: colors.inkSoft }]}>
            No hay ciclos registrados en este rango todavía. Con un período cargado ya
            se puede generar el reporte.
          </Text>
        </Card>
      ) : (
        <>
          <Card index={3}>
            <Eyebrow>Vista previa</Eyebrow>
            <View style={styles.previewList}>
              <PreviewRow label="Ciclos registrados" value={String(report.cycleCount)} />
              <PreviewRow
                label="Duración promedio"
                value={report.avgCycleLength !== null ? `${report.avgCycleLength} días` : "—"}
              />
              <PreviewRow
                label="Variación"
                value={
                  report.minCycleLength !== null
                    ? `${report.minCycleLength} a ${report.maxCycleLength} días`
                    : "—"
                }
              />
            </View>
            {report.isIrregular && (
              <View style={styles.flagBox}>
                <Text style={[type.bodySmall, { color: colors.clayDeep }]}>
                  La duración varió bastante entre ciclos. Es un dato útil para
                  comentarle a un profesional — no significa por sí solo que haya algo
                  mal.
                </Text>
              </View>
            )}
          </Card>

          <FadeInView index={4}>
            <PrimaryButton
              label={exporting ? "Generando..." : "Exportar PDF"}
              onPress={handleExport}
              disabled={exporting}
            />
          </FadeInView>
        </>
      )}
    </ScrollView>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewRow}>
      <Text style={[type.body, { color: colors.inkSoft }]}>{label}</Text>
      <Text style={[type.cardTitle, { color: colors.ink }]}>{value}</Text>
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
  pageTitle: { color: colors.ink, marginTop: space.xs, marginBottom: space.xs },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: space.md,
  },
  chipWrap: { flexDirection: "row", gap: space.sm, marginTop: space.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: space.lg,
  },
  chipSelected: { backgroundColor: colors.clay, borderColor: colors.clay },
  previewList: { marginTop: space.md, gap: space.md },
  previewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  flagBox: {
    backgroundColor: "#F5E9E3",
    borderRadius: radius.md,
    padding: space.md,
    marginTop: space.lg,
  },
  stateText: { color: colors.inkSoft, textAlign: "center", paddingVertical: space.xl },
});
