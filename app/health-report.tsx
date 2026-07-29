import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { listCycles, listDailyLogs } from "@/lib/db";
import { buildHealthReport, type HealthReportData } from "@/lib/healthReport";
import { buildHealthReportHtml } from "@/lib/healthReportHtml";
import { exportHealthReport, PopupBlockedError } from "@/lib/healthReportExport";

const RANGE_OPTIONS = [3, 6, 12];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// Alert.alert es un no-op en react-native-web (ver la nota en
// pregnancy-setup.tsx) — en web usamos window.alert en su lugar.
function notify(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
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
      const html = buildHealthReportHtml(report, todayStr());
      await exportHealthReport(html);
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.body}>
        Un resumen de tus ciclos pensado para mostrarle a un profesional: duración
        promedio, variación, irregularidades y los síntomas y estados de ánimo más
        frecuentes. Se genera en el dispositivo — no pasa por ningún servidor.
      </Text>

      <View style={styles.chipRow}>
        {RANGE_OPTIONS.map((months) => (
          <Pressable
            key={months}
            onPress={() => setRangeMonths(months)}
            style={[styles.chip, rangeMonths === months && styles.chipSelected]}
          >
            <Text style={[styles.chipText, rangeMonths === months && styles.chipTextSelected]}>
              {months} meses
            </Text>
          </Pressable>
        ))}
      </View>

      {loading || !report ? (
        <Text style={styles.body}>Calculando...</Text>
      ) : report.cycleCount === 0 ? (
        <Text style={styles.body}>
          No hay ciclos registrados en este rango todavía. Registrá al menos un
          período para poder generar el reporte.
        </Text>
      ) : (
        <>
          <View style={styles.previewCard}>
            <PreviewRow label="Ciclos registrados" value={String(report.cycleCount)} />
            <PreviewRow
              label="Duración promedio de ciclo"
              value={report.avgCycleLength !== null ? `${report.avgCycleLength} días` : "—"}
            />
            <PreviewRow
              label="Rango (mín. – máx.)"
              value={
                report.minCycleLength !== null
                  ? `${report.minCycleLength}–${report.maxCycleLength} días`
                  : "—"
              }
            />
            {report.isIrregular && (
              <Text style={styles.flagText}>La duración del ciclo varió bastante en este rango.</Text>
            )}
          </View>

          <Pressable style={styles.primaryButton} onPress={handleExport} disabled={exporting}>
            <Text style={styles.primaryButtonText}>
              {exporting ? "Generando..." : "Exportar / compartir PDF"}
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewRow}>
      <Text style={styles.previewLabel}>{label}</Text>
      <Text style={styles.previewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16 },
  body: { color: "#555", fontSize: 13, lineHeight: 18 },
  chipRow: { flexDirection: "row", gap: 8 },
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
  previewCard: { backgroundColor: "#F4F1FA", borderRadius: 14, padding: 16, gap: 10 },
  previewRow: { flexDirection: "row", justifyContent: "space-between" },
  previewLabel: { color: "#555", fontSize: 13 },
  previewValue: { color: "#2C1A4D", fontSize: 13, fontWeight: "700" },
  flagText: { color: "#C2185B", fontSize: 12, fontWeight: "600" },
  primaryButton: {
    backgroundColor: "#2C1A4D",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
