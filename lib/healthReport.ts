/**
 * Reporte de salud para compartir con un profesional: duración de ciclo,
 * variación, irregularidad y síntomas/ánimo más frecuentes en un rango de
 * meses. Módulo puro — recibe los datos ya leídos de db.ts, no accede al
 * almacenamiento. La generación del PDF vive en healthReportExport.ts.
 */

import { addDays, diffDays } from "./cycle";
import type { CycleRecord, DailyLog } from "./types";

export interface CycleSummary {
  startDate: string;
  periodLength: number | null;
  /** Días hasta el inicio del ciclo siguiente; null si es el más reciente del rango. */
  lengthToNextCycle: number | null;
}

export interface FrequencyCount {
  label: string;
  count: number;
}

export interface HealthReportData {
  rangeMonths: number;
  rangeStart: string;
  rangeEnd: string;
  cycleCount: number;
  avgCycleLength: number | null;
  minCycleLength: number | null;
  maxCycleLength: number | null;
  avgPeriodLength: number | null;
  isIrregular: boolean;
  cycles: CycleSummary[];
  topSymptoms: FrequencyCount[];
  topMoods: FrequencyCount[];
}

// Variación entre el ciclo más corto y el más largo del rango a partir de la
// cual se marca como irregular. Umbral "de libro" (ACOG considera irregular
// una variación mayor a 7-9 días entre ciclos consecutivos) — no es
// diagnóstico, solo orienta la lectura del reporte.
export const IRREGULARITY_THRESHOLD_DAYS = 7;

const TOP_FREQUENCY_COUNT = 5;

export function countFrequencies(lists: string[][]): FrequencyCount[] {
  const counts = new Map<string, number>();
  for (const list of lists) {
    for (const item of list) {
      counts.set(item, (counts.get(item) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_FREQUENCY_COUNT);
}

export function buildHealthReport(
  allCycles: CycleRecord[],
  allLogs: DailyLog[],
  rangeMonths: number,
  today: string
): HealthReportData {
  const rangeStart = addDays(today, -rangeMonths * 30);

  const cycles = allCycles
    .filter((c) => c.startDate >= rangeStart && c.startDate <= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const logs = allLogs.filter((l) => l.logDate >= rangeStart && l.logDate <= today);

  const gaps: number[] = [];
  const cycleSummaries: CycleSummary[] = cycles.map((cycle, i) => {
    const next = cycles[i + 1];
    const lengthToNextCycle = next ? diffDays(cycle.startDate, next.startDate) : null;
    if (lengthToNextCycle !== null) gaps.push(lengthToNextCycle);
    return {
      startDate: cycle.startDate,
      periodLength: cycle.periodLength,
      lengthToNextCycle,
    };
  });

  const avgCycleLength = gaps.length
    ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
    : null;
  const minCycleLength = gaps.length ? Math.min(...gaps) : null;
  const maxCycleLength = gaps.length ? Math.max(...gaps) : null;
  const isIrregular =
    minCycleLength !== null &&
    maxCycleLength !== null &&
    maxCycleLength - minCycleLength > IRREGULARITY_THRESHOLD_DAYS;

  const periodLengths = cycles
    .map((c) => c.periodLength)
    .filter((n): n is number => typeof n === "number" && n > 0);
  const avgPeriodLength = periodLengths.length
    ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
    : null;

  return {
    rangeMonths,
    rangeStart,
    rangeEnd: today,
    cycleCount: cycles.length,
    avgCycleLength,
    minCycleLength,
    maxCycleLength,
    avgPeriodLength,
    isIrregular,
    cycles: cycleSummaries,
    topSymptoms: countFrequencies(logs.map((l) => l.symptoms)),
    topMoods: countFrequencies(logs.map((l) => l.mood)),
  };
}
