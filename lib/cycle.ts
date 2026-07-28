/**
 * Algoritmo de predicción del ciclo menstrual.
 *
 * Todas las fechas son strings 'YYYY-MM-DD' (sin hora) para evitar bugs de
 * zona horaria: se parsean siempre como UTC medianoche y nunca se comparan
 * con Date.now() directamente.
 */

export type CyclePhase = "menstrual" | "folicular" | "ovulacion" | "lutea";

export interface PastCycle {
  /** Primer día de sangrado de ese ciclo. */
  startDate: string;
  /** Duración del sangrado en días, si se registró. */
  periodLength?: number;
}

export interface CycleStats {
  avgCycleLength: number;
  avgPeriodLength: number;
  /** false si se usaron los valores por defecto por falta de datos. */
  isEstimated: boolean;
}

export interface CyclePrediction {
  cycleDay: number;
  phase: CyclePhase;
  ovulationDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  nextPeriodDate: string;
  daysUntilNextPeriod: number;
}

// Defaults clínicos estándar. Se usan solo cuando no hay ciclos suficientes
// para calcular un promedio real: sin datos, mejor asumir el ciclo "de
// libro" que no dar una predicción vacía.
export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_LENGTH = 5;

// La fase lútea es la parte del ciclo con menos variación biológica entre
// personas, por eso se usa como constante para ubicar la ovulación en vez
// de partir el ciclo al medio.
const LUTEAL_PHASE_LENGTH = 14;

function parseUTCDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUTCDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const date = parseUTCDate(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return formatUTCDate(date);
}

export function diffDays(fromStr: string, toStr: string): number {
  const from = parseUTCDate(fromStr);
  const to = parseUTCDate(toStr);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

/**
 * Calcula el promedio de duración de ciclo y de período a partir del
 * historial. Necesita al menos 2 ciclos para inferir una duración de ciclo
 * real (la resta entre inicios consecutivos); con menos, usa los defaults.
 */
export function computeCycleStats(pastCycles: PastCycle[]): CycleStats {
  const sorted = [...pastCycles].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );

  const periodLengths = sorted
    .map((c) => c.periodLength)
    .filter((n): n is number => typeof n === "number" && n > 0);
  const avgPeriodLength = periodLengths.length
    ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
    : DEFAULT_PERIOD_LENGTH;

  if (sorted.length < 2) {
    return {
      avgCycleLength: DEFAULT_CYCLE_LENGTH,
      avgPeriodLength,
      isEstimated: true,
    };
  }

  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(diffDays(sorted[i - 1].startDate, sorted[i].startDate));
  }
  const avgCycleLength = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);

  return { avgCycleLength, avgPeriodLength, isEstimated: false };
}

/**
 * Predice fase actual, ovulación, ventana fértil y próximo período a partir
 * del último inicio de período conocido.
 */
export function predictCycle(
  lastPeriodStart: string,
  today: string,
  stats: CycleStats
): CyclePrediction {
  const { avgCycleLength, avgPeriodLength } = stats;

  const rawCycleDay = diffDays(lastPeriodStart, today) + 1;
  // Si "today" cayó después del próximo período esperado (ciclo más largo
  // que el promedio), seguimos contando sobre el mismo ciclo en vez de dar
  // un día de ciclo negativo o de reiniciar sin datos nuevos.
  const cycleDay = rawCycleDay > 0 ? rawCycleDay : 1;

  const ovulationDay = Math.max(
    avgPeriodLength + 1,
    avgCycleLength - LUTEAL_PHASE_LENGTH
  );
  const ovulationDate = addDays(lastPeriodStart, ovulationDay - 1);
  const fertileWindowStart = addDays(ovulationDate, -5);
  const fertileWindowEnd = addDays(ovulationDate, 1);
  const nextPeriodDate = addDays(lastPeriodStart, avgCycleLength);
  const daysUntilNextPeriod = diffDays(today, nextPeriodDate);

  let phase: CyclePhase;
  if (cycleDay <= avgPeriodLength) {
    phase = "menstrual";
  } else if (cycleDay < ovulationDay) {
    phase = "folicular";
  } else if (cycleDay === ovulationDay) {
    phase = "ovulacion";
  } else {
    phase = "lutea";
  }

  return {
    cycleDay,
    phase,
    ovulationDate,
    fertileWindowStart,
    fertileWindowEnd,
    nextPeriodDate,
    daysUntilNextPeriod,
  };
}
