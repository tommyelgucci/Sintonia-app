/**
 * Armado del calendario mensual: qué pintar en cada casillero.
 *
 * Todo acá es función pura sobre strings 'YYYY-MM-DD', igual que cycle.ts —
 * sin tocar la base ni el reloj. La pantalla solo dibuja lo que estas
 * funciones devuelven, así que el comportamiento se puede testear sin
 * montar nada.
 *
 * La distinción que ordena el archivo es registrado vs. estimado. Un día de
 * período que la usuaria marcó es un hecho; uno proyectado hacia adelante
 * es una cuenta que puede fallar. Se marcan distinto a propósito: una app
 * de ciclo que muestra las dos cosas iguales termina haciendo que alguien
 * tome una decisión sobre una estimación creyendo que era un dato.
 */

import {
  addDays,
  computeCycleStats,
  diffDays,
  ovulationDayForCycle,
  type CycleStats,
  type PastCycle,
} from "./cycle";
import type { DailyLog } from "./types";

export type DayMarker =
  | "period" // sangrado registrado
  | "predictedPeriod" // período proyectado
  | "ovulation"
  | "fertile"
  | null;

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  /** false para los días de relleno del mes anterior/siguiente. */
  inMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  marker: DayMarker;
  /** Hay un registro diario guardado (síntomas, ánimo, notas o flujo). */
  hasLog: boolean;
  /** Primer día de un ciclo registrado. */
  isCycleStart: boolean;
}

export interface CycleHistoryEntry {
  startDate: string;
  /** Duración hasta el inicio siguiente. null en el ciclo en curso. */
  cycleLength: number | null;
  /** Días de sangrado registrados en ese ciclo, si hay logs con flujo. */
  periodLength: number | null;
}

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"] as const;
const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export const WEEKDAYS = WEEKDAY_LABELS;

export function monthLabel(year: number, month: number): string {
  return `${MONTH_LABELS[month - 1]} ${year}`;
}

/** '2026-08' → primer día. Mes 1-12, no el 0-11 de Date. */
function firstOfMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Día de la semana con la semana arrancando en lunes (0 = lunes). En
 * español el calendario empieza el lunes; getUTCDay() devuelve 0 para
 * domingo, así que se rota.
 */
function mondayIndex(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const zeroBased = year * 12 + (month - 1) + delta;
  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 };
}

/**
 * Inicios de período proyectados hacia adelante desde el último registrado,
 * hasta cubrir `until`. Sin esto, mover el calendario al mes que viene
 * mostraría un mes vacío justo cuando lo que se está yendo a mirar es
 * cuándo cae el próximo período.
 */
function projectStarts(lastStart: string, cycleLength: number, until: string): string[] {
  const projected: string[] = [];
  let next = addDays(lastStart, cycleLength);
  // Tope duro: un ciclo de longitud inválida (0 o negativa, si alguna vez
  // entrara por datos corruptos) colgaría el loop.
  while (diffDays(next, until) >= 0 && projected.length < 400) {
    projected.push(next);
    next = addDays(next, Math.max(cycleLength, 1));
  }
  return projected;
}

interface Segment {
  start: string;
  /** Longitud usada para ubicar la ovulación de ese ciclo. */
  cycleLength: number;
  periodLength: number;
  recorded: boolean;
}

/**
 * Convierte los ciclos guardados (más la proyección hacia adelante) en
 * segmentos con la longitud real de cada uno. Para un ciclo pasado se usa
 * la distancia al inicio siguiente en vez del promedio: si ese mes el ciclo
 * duró 34 días, la ventana fértil que se muestra en el historial tiene que
 * ser la de ese ciclo, no la del promedio.
 */
function buildSegments(cycles: PastCycle[], stats: CycleStats, until: string): Segment[] {
  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const segments: Segment[] = sorted.map((cycle, i) => {
    const next = sorted[i + 1];
    const measured = next ? diffDays(cycle.startDate, next.startDate) : null;
    return {
      start: cycle.startDate,
      cycleLength: measured && measured > 0 ? measured : stats.avgCycleLength,
      periodLength: cycle.periodLength ?? stats.avgPeriodLength,
      recorded: true,
    };
  });

  if (sorted.length > 0) {
    const lastStart = sorted[sorted.length - 1].startDate;
    for (const start of projectStarts(lastStart, stats.avgCycleLength, until)) {
      segments.push({
        start,
        cycleLength: stats.avgCycleLength,
        periodLength: stats.avgPeriodLength,
        recorded: false,
      });
    }
  }

  return segments;
}

/** Gana lo más concreto: un hecho registrado por encima de una estimación. */
const MARKER_PRIORITY: Record<Exclude<DayMarker, null>, number> = {
  period: 4,
  predictedPeriod: 3,
  ovulation: 2,
  fertile: 1,
};

function place(marks: Map<string, Exclude<DayMarker, null>>, date: string, marker: Exclude<DayMarker, null>) {
  const current = marks.get(date);
  if (current && MARKER_PRIORITY[current] >= MARKER_PRIORITY[marker]) return;
  marks.set(date, marker);
}

export interface MonthOptions {
  year: number;
  month: number;
  cycles: PastCycle[];
  logs: DailyLog[];
  today: string;
}

/**
 * Grilla completa del mes, incluidos los días de relleno para que la
 * primera y la última semana queden enteras.
 */
export function buildMonth({ year, month, cycles, logs, today }: MonthOptions): CalendarDay[] {
  const total = daysInMonth(year, month);
  const leading = mondayIndex(firstOfMonth(year, month));
  const gridStart = addDays(firstOfMonth(year, month), -leading);
  const trailing = (7 - ((leading + total) % 7)) % 7;
  const gridLength = leading + total + trailing;
  const gridEnd = addDays(gridStart, gridLength - 1);

  const stats = computeCycleStats(cycles);
  const segments = buildSegments(cycles, stats, gridEnd);
  const marks = new Map<string, Exclude<DayMarker, null>>();

  for (const segment of segments) {
    const ovulationDay = ovulationDayForCycle(segment.cycleLength, segment.periodLength);
    const ovulationDate = addDays(segment.start, ovulationDay - 1);

    for (let offset = -5; offset <= 1; offset++) {
      place(marks, addDays(ovulationDate, offset), offset === 0 ? "ovulation" : "fertile");
    }
    for (let day = 0; day < segment.periodLength; day++) {
      // El sangrado de un ciclo registrado sigue siendo una estimación
      // después de hoy: se registró el inicio, no cuántos días duró.
      const date = addDays(segment.start, day);
      const isFact = segment.recorded && diffDays(date, today) >= 0;
      place(marks, date, isFact ? "period" : "predictedPeriod");
    }
  }

  // Un día con flujo registrado es sangrado real, sin importar qué diga la
  // proyección: pisa cualquier marca estimada.
  const loggedDates = new Set(logs.map((l) => l.logDate));
  for (const log of logs) {
    if (log.flow !== "none") marks.set(log.logDate, "period");
  }

  const cycleStarts = new Set(cycles.map((c) => c.startDate));

  return Array.from({ length: gridLength }, (_, i) => {
    const date = addDays(gridStart, i);
    const dayOfMonth = Number(date.slice(8, 10));
    return {
      date,
      dayOfMonth,
      inMonth: date.slice(0, 7) === firstOfMonth(year, month).slice(0, 7),
      isToday: date === today,
      isFuture: diffDays(today, date) > 0,
      marker: marks.get(date) ?? null,
      hasLog: loggedDates.has(date),
      isCycleStart: cycleStarts.has(date),
    };
  });
}

/**
 * Sanea la fecha que llega por la URL antes de usarla para leer o escribir.
 * En web el parámetro es editable a mano, y expo-router además puede
 * entregar un array si el query trae la clave repetida. Cualquier cosa que
 * no sea una fecha real y pasada cae a hoy: una fecha inventada guardaría
 * un registro en un día que no existe, y una futura dejaría escribir sobre
 * algo que todavía no pasó.
 */
export function normalizeDateParam(raw: unknown, today: string): string {
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return today;

  const [year, month, day] = raw.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
  if (!isRealDate) return today;

  return diffDays(today, raw) > 0 ? today : raw;
}

/**
 * En qué día de ciclo cae una fecha, según el inicio registrado más
 * reciente que la precede. null si esa fecha es anterior a todo lo
 * registrado — ahí no hay forma de saberlo y es mejor no decir nada que
 * inventar un número.
 */
export function cycleDayFor(date: string, cycles: PastCycle[]): number | null {
  const previous = cycles
    .map((c) => c.startDate)
    .filter((start) => diffDays(start, date) >= 0)
    .sort();
  if (previous.length === 0) return null;
  return diffDays(previous[previous.length - 1], date) + 1;
}

/**
 * Historial de ciclos, del más reciente al más viejo. La duración del
 * sangrado sale de los días con flujo registrado dentro del ciclo, no del
 * campo `periodLength` (que hoy casi siempre viene vacío porque se marca el
 * inicio y nada más).
 */
export function buildCycleHistory(cycles: PastCycle[], logs: DailyLog[]): CycleHistoryEntry[] {
  const sorted = [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const bleedDays = logs.filter((l) => l.flow !== "none").map((l) => l.logDate);

  return sorted
    .map((cycle, i) => {
      const next = sorted[i + 1];
      const cycleLength = next ? diffDays(cycle.startDate, next.startDate) : null;

      const withinCycle = bleedDays.filter((date) => {
        const fromStart = diffDays(cycle.startDate, date);
        if (fromStart < 0) return false;
        return next ? diffDays(date, next.startDate) > 0 : true;
      });
      // Días de sangrado contados desde el inicio: si hubo spotting suelto
      // más tarde en el ciclo, contar el largo hasta ahí inflaría el número.
      const measured = withinCycle.length
        ? Math.max(...withinCycle.map((date) => diffDays(cycle.startDate, date) + 1))
        : null;

      return {
        startDate: cycle.startDate,
        cycleLength: cycleLength && cycleLength > 0 ? cycleLength : null,
        periodLength: cycle.periodLength ?? measured,
      };
    })
    .reverse();
}
