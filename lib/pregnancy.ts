/**
 * Cálculo de progreso de embarazo. Mismas convenciones que cycle.ts: fechas
 * como 'YYYY-MM-DD', parseadas siempre en UTC medianoche para no arrastrar
 * bugs de zona horaria.
 */

import { addDays, diffDays } from "./cycle";

export type Trimester = "primero" | "segundo" | "tercero";

// Convención obstétrica estándar: la edad gestacional se cuenta desde el
// primer día de la última menstruación (FUM), no desde la concepción (que
// ocurre ~2 semanas después). El día de la FUM es "semana 0, día 0".
export const PREGNANCY_LENGTH_DAYS = 280;

// Más allá de esto ya se considera embarazo postérmino — no seguimos
// contando semanas de contenido más allá, solo mostramos el mismo aviso.
export const MAX_TRACKED_WEEK = 42;

export interface PregnancyProgress {
  week: number;
  dayOfWeek: number; // 0-6
  trimester: Trimester;
  dueDate: string;
  daysUntilDueDate: number;
}

export function dueDateFromLmp(lmpDate: string): string {
  return addDays(lmpDate, PREGNANCY_LENGTH_DAYS);
}

export function lmpFromDueDate(dueDate: string): string {
  return addDays(dueDate, -PREGNANCY_LENGTH_DAYS);
}

export function computePregnancyProgress(
  lmpDate: string,
  today: string
): PregnancyProgress {
  const totalDays = Math.max(0, diffDays(lmpDate, today));
  const rawWeek = Math.floor(totalDays / 7);
  const week = Math.min(rawWeek, MAX_TRACKED_WEEK);
  const dayOfWeek = rawWeek >= MAX_TRACKED_WEEK ? 0 : totalDays % 7;

  const dueDate = dueDateFromLmp(lmpDate);
  const daysUntilDueDate = diffDays(today, dueDate);

  const trimester: Trimester = week < 13 ? "primero" : week < 27 ? "segundo" : "tercero";

  return { week, dayOfWeek, trimester, dueDate, daysUntilDueDate };
}

// Único punto de validación de fecha manual en la app (FUM / fecha probable
// de parto) — se valida acá porque es la frontera donde entra un dato
// escrito a mano por la usuaria, no en las pantallas que lo consumen.
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
