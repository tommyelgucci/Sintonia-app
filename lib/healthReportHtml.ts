import type { HealthReportData } from "./healthReport";

const RANGE_LABELS: Record<number, string> = {
  3: "Últimos 3 meses",
  6: "Últimos 6 meses",
  12: "Últimos 12 meses",
};

function formatDays(value: number | null): string {
  return value === null ? "—" : `${value} días`;
}

function cyclesRows(report: HealthReportData): string {
  if (report.cycles.length === 0) {
    return `<tr><td colspan="3">No hay ciclos registrados en este rango.</td></tr>`;
  }
  return report.cycles
    .map(
      (c) => `<tr>
        <td>${c.startDate}</td>
        <td>${c.periodLength !== null ? `${c.periodLength} días` : "—"}</td>
        <td>${c.lengthToNextCycle !== null ? `${c.lengthToNextCycle} días` : "—"}</td>
      </tr>`
    )
    .join("");
}

function frequencyRows(items: HealthReportData["topSymptoms"]): string {
  if (items.length === 0) return `<tr><td colspan="2">Sin registros en este rango.</td></tr>`;
  return items
    .map((i) => `<tr><td>${i.label}</td><td>${i.count} ${i.count === 1 ? "vez" : "veces"}</td></tr>`)
    .join("");
}

/**
 * HTML pensado para lectura clínica: tablas, sin gráficos, tipografía
 * legible impresa. Es el mismo documento que se manda a expo-print (nativo)
 * o a window.print() (web) — ver healthReportExport.ts.
 */
export function buildHealthReportHtml(report: HealthReportData, generatedOn: string): string {
  const rangeLabel = RANGE_LABELS[report.rangeMonths] ?? `Últimos ${report.rangeMonths} meses`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Reporte de ciclo — Sintonía</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; margin: 32px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .subtitle { color: #555; font-size: 12px; margin-bottom: 24px; }
  h2 { font-size: 14px; margin-top: 28px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e0e0e0; }
  th { color: #555; font-weight: 600; }
  .summary-grid { display: flex; flex-wrap: wrap; gap: 24px; font-size: 12px; }
  .summary-item strong { display: block; font-size: 16px; color: #1a1a1a; }
  .flag { color: #a13a1a; font-weight: 600; }
  .footer { margin-top: 32px; font-size: 10px; color: #888; }
</style>
</head>
<body>
  <h1>Reporte de ciclo menstrual</h1>
  <div class="subtitle">
    ${rangeLabel} (${report.rangeStart} a ${report.rangeEnd}) — generado el ${generatedOn} con Sintonía
  </div>

  <h2>Resumen</h2>
  <div class="summary-grid">
    <div class="summary-item">Ciclos registrados<strong>${report.cycleCount}</strong></div>
    <div class="summary-item">Duración promedio de ciclo<strong>${formatDays(report.avgCycleLength)}</strong></div>
    <div class="summary-item">Rango (mín. – máx.)<strong>${
      report.minCycleLength !== null ? `${report.minCycleLength}–${report.maxCycleLength} días` : "—"
    }</strong></div>
    <div class="summary-item">Duración promedio de sangrado<strong>${formatDays(report.avgPeriodLength)}</strong></div>
  </div>
  ${
    report.isIrregular
      ? `<p class="flag">La duración del ciclo varió más de ${report.maxCycleLength! - report.minCycleLength!} días en este rango.</p>`
      : ""
  }

  <h2>Ciclos en el rango</h2>
  <table>
    <thead><tr><th>Inicio</th><th>Duración del sangrado</th><th>Días hasta el siguiente</th></tr></thead>
    <tbody>${cyclesRows(report)}</tbody>
  </table>

  <h2>Síntomas físicos más frecuentes</h2>
  <table>
    <thead><tr><th>Síntoma</th><th>Frecuencia</th></tr></thead>
    <tbody>${frequencyRows(report.topSymptoms)}</tbody>
  </table>

  <h2>Ánimo más frecuente</h2>
  <table>
    <thead><tr><th>Ánimo</th><th>Frecuencia</th></tr></thead>
    <tbody>${frequencyRows(report.topMoods)}</tbody>
  </table>

  <p class="footer">
    Generado localmente en el dispositivo a partir de los registros cargados en Sintonía.
    No es un diagnóstico médico ni reemplaza una evaluación clínica.
  </p>
</body>
</html>`;
}
