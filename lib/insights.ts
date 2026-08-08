/**
 * Estadísticas de tendencia para la pantalla de insights.
 *
 * Distinto propósito que healthReport.ts: ese módulo arma un resumen
 * clínico acotado a un rango de meses para llevar a una consulta; este
 * mira todo el historial disponible para mostrar la tendencia reciente y
 * qué tan constante es el registro — la pregunta no es "qué le muestro al
 * médico" sino "qué tan regular soy y cuánto estoy registrando". Módulo
 * puro, igual que healthReport.ts: recibe los datos ya leídos de db.ts.
 */

import { diffDays } from "./cycle";
import { countFrequencies, type FrequencyCount } from "./healthReport";
import type { CycleRecord, DailyLog } from "./types";

export type { FrequencyCount };

export interface CycleLengthPoint {
  /** Inicio del ciclo que generó esta duración (el ciclo, no el siguiente). */
  startDate: string;
  length: number;
}

export interface CycleInsights {
  /** false con 0 o 1 ciclo: hace falta una brecha entre inicios para medir duración. */
  hasEnoughData: boolean;
  cycleCount: number;
  avgCycleLength: number | null;
  avgPeriodLength: number | null;
  minCycleLength: number | null;
  maxCycleLength: number | null;
  /** Duraciones más recientes primero, hasta MAX_HISTORY_POINTS. */
  cycleLengthHistory: CycleLengthPoint[];
  topSymptoms: FrequencyCount[];
  topMoods: FrequencyCount[];
  topDischargeSigns: FrequencyCount[];
  loggedDaysCount: number;
  /** Días transcurridos desde el primer ciclo registrado hasta hoy. */
  trackedDaysCount: number;
  /** loggedDaysCount / trackedDaysCount, acotado a [0, 1]. */
  loggingRate: number;
}

// Suficiente para un vistazo de tendencia sin que la grilla de barras se
// vuelva ilegible en una pantalla angosta; los ciclos más viejos siguen
// contando para el promedio, solo no entran en el gráfico.
const MAX_HISTORY_POINTS = 12;

export function buildCycleInsights(
  allCycles: CycleRecord[],
  allLogs: DailyLog[],
  today: string
): CycleInsights {
  const sorted = [...allCycles].sort((a, b) => a.startDate.localeCompare(b.startDate));

  const gaps: CycleLengthPoint[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push({
      startDate: sorted[i - 1].startDate,
      length: diffDays(sorted[i - 1].startDate, sorted[i].startDate),
    });
  }

  const lengths = gaps.map((g) => g.length);
  const avgCycleLength = lengths.length
    ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
    : null;
  const minCycleLength = lengths.length ? Math.min(...lengths) : null;
  const maxCycleLength = lengths.length ? Math.max(...lengths) : null;

  const periodLengths = sorted
    .map((c) => c.periodLength)
    .filter((n): n is number => typeof n === "number" && n > 0);
  const avgPeriodLength = periodLengths.length
    ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
    : null;

  // Desde que hay al menos un ciclo cargado hasta hoy, contando el primer
  // día: es la ventana contra la que tiene sentido medir "cuánto registré".
  const trackedDaysCount = sorted.length
    ? Math.max(1, diffDays(sorted[0].startDate, today) + 1)
    : 0;
  const loggedDaysCount = allLogs.length;
  const loggingRate = trackedDaysCount > 0 ? Math.min(1, loggedDaysCount / trackedDaysCount) : 0;

  return {
    hasEnoughData: sorted.length >= 2,
    cycleCount: sorted.length,
    avgCycleLength,
    avgPeriodLength,
    minCycleLength,
    maxCycleLength,
    cycleLengthHistory: gaps.slice(-MAX_HISTORY_POINTS),
    topSymptoms: countFrequencies(allLogs.map((l) => l.symptoms)),
    topMoods: countFrequencies(allLogs.map((l) => l.mood)),
    topDischargeSigns: countFrequencies(allLogs.map((l) => l.dischargeSigns)),
    loggedDaysCount,
    trackedDaysCount,
    loggingRate,
  };
}
