/**
 * Qué recordatorios corresponden y con qué texto.
 *
 * Funciones puras sobre strings 'YYYY-MM-DD', igual que el resto del
 * dominio: acá se decide *qué* avisar, y `lib/notifications.ts` se encarga
 * de agendarlo en el sistema. Esa separación es la que permite testear el
 * comportamiento sin permisos, sin reloj y sin dispositivo.
 *
 * Dos criterios que ordenan el archivo:
 *
 * 1. **El default es discreto.** Una notificación de una app de ciclo
 *    aparece en la pantalla bloqueada, que es un lugar que la usuaria no
 *    controla — la puede leer cualquiera que mire el teléfono sobre la
 *    mesa. Por eso el modo discreto viene prendido: el aviso llega igual,
 *    pero el contenido se ve recién adentro de la app.
 * 2. **Ningún recordatorio insiste ni reta.** Se avisa una vez por evento.
 *    No hay "no registraste ayer" ni rachas que perder.
 */

import { addDays, diffDays, type CyclePrediction } from "./cycle";
import type { Intention } from "./useIntention";

export interface ReminderSettings {
  /** Aviso de que el período estaría por empezar, y el día estimado. */
  periodSoon: boolean;
  /** Aviso de inicio de ventana fértil. Solo aplica buscando embarazo. */
  fertileWindow: boolean;
  /** Recordatorio diario para registrar. */
  dailyLog: boolean;
  /** Días de anticipación del aviso de período (1 a 7). */
  daysBefore: number;
  /** Hora del día en que llegan los avisos (0 a 23). */
  hour: number;
  /** Oculta el contenido en la notificación del sistema. */
  discreet: boolean;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  periodSoon: false,
  fertileWindow: false,
  dailyLog: false,
  daysBefore: 2,
  hour: 10,
  discreet: true,
};

export const MIN_DAYS_BEFORE = 1;
export const MAX_DAYS_BEFORE = 7;

export type ReminderKind = "periodSoon" | "periodToday" | "fertileWindow" | "dailyLog";

export interface PlannedReminder {
  kind: ReminderKind;
  /** Fecha del aviso, o null si se repite todos los días. */
  date: string | null;
  hour: number;
  repeatsDaily: boolean;
  title: string;
  body: string;
}

/**
 * Texto discreto: el mismo para todos los tipos, a propósito. Si variara
 * por tipo, el largo o la forma del aviso ya delataría de qué se trata.
 */
const DISCREET_COPY = {
  title: "Sintonía",
  body: "Tenés un recordatorio. Abrilo cuando estés tranquila.",
};

function copyFor(kind: ReminderKind, settings: ReminderSettings): { title: string; body: string } {
  if (settings.discreet) return DISCREET_COPY;

  switch (kind) {
    case "periodSoon":
      return {
        title: "Tu período estaría por empezar",
        body:
          settings.daysBefore === 1
            ? "Según tus últimos ciclos, mañana. Puede correrse: es una estimación."
            : `Según tus últimos ciclos, en ${settings.daysBefore} días. Puede correrse: es una estimación.`,
      };
    case "periodToday":
      return {
        title: "Hoy podría empezar tu período",
        body: "Si empezó, marcalo y la predicción se ajusta sola.",
      };
    case "fertileWindow":
      return {
        title: "Empieza tu ventana fértil",
        body: "Los próximos días son los de más chances, según tus ciclos.",
      };
    case "dailyLog":
      return {
        title: "¿Cómo venís hoy?",
        body: "Un minuto para anotar flujo, síntomas o ánimo. Lo que quieras.",
      };
  }
}

export interface ReminderPlanInput {
  settings: ReminderSettings;
  /** null si todavía no hay datos suficientes para predecir. */
  prediction: CyclePrediction | null;
  intention: Intention;
  today: string;
}

/**
 * Los recordatorios que hay que dejar agendados. Se recalcula entero cada
 * vez (no se parchea el anterior): el plan es función del estado actual, y
 * cualquier registro nuevo mueve las fechas.
 */
export function buildReminderPlan({
  settings,
  prediction,
  intention,
  today,
}: ReminderPlanInput): PlannedReminder[] {
  const plan: PlannedReminder[] = [];
  const hour = clampHour(settings.hour);

  if (settings.dailyLog) {
    plan.push({
      kind: "dailyLog",
      date: null,
      hour,
      repeatsDaily: true,
      ...copyFor("dailyLog", settings),
    });
  }

  // En embarazo no se avisa nada del ciclo. Un "tu período estaría por
  // empezar" en esa situación es, en el mejor caso, ruido; y si el
  // embarazo terminó y la fecha quedó cargada, es cruel.
  if (intention === "pregnant" || !prediction) return plan;

  if (settings.periodSoon) {
    const daysBefore = clampDaysBefore(settings.daysBefore);
    const warningDate = addDays(prediction.nextPeriodDate, -daysBefore);

    // Solo se agenda lo que todavía no pasó: el aviso de un ciclo que ya
    // arrancó no sirve, y agendarlo en el pasado no dispara nada.
    if (isFuture(warningDate, today)) {
      plan.push({
        kind: "periodSoon",
        date: warningDate,
        hour,
        repeatsDaily: false,
        ...copyFor("periodSoon", settings),
      });
    }
    if (isFuture(prediction.nextPeriodDate, today)) {
      plan.push({
        kind: "periodToday",
        date: prediction.nextPeriodDate,
        hour,
        repeatsDaily: false,
        ...copyFor("periodToday", settings),
      });
    }
  }

  if (settings.fertileWindow && intention === "conceiving") {
    if (isFuture(prediction.fertileWindowStart, today)) {
      plan.push({
        kind: "fertileWindow",
        date: prediction.fertileWindowStart,
        hour,
        repeatsDaily: false,
        ...copyFor("fertileWindow", settings),
      });
    }
  }

  return plan;
}

/**
 * Un aviso de hoy se considera pasado: no sabemos a qué hora se está
 * recalculando el plan, y agendar para una hora que ya pasó hace que el
 * sistema lo dispare al instante — la usuaria recibiría el aviso apenas
 * abre la app, sin ningún motivo.
 */
function isFuture(date: string, today: string): boolean {
  return diffDays(today, date) > 0;
}

export function clampHour(hour: number): number {
  if (!Number.isFinite(hour)) return DEFAULT_REMINDER_SETTINGS.hour;
  return Math.min(23, Math.max(0, Math.round(hour)));
}

export function clampDaysBefore(days: number): number {
  if (!Number.isFinite(days)) return DEFAULT_REMINDER_SETTINGS.daysBefore;
  return Math.min(MAX_DAYS_BEFORE, Math.max(MIN_DAYS_BEFORE, Math.round(days)));
}

/**
 * Lee las preferencias guardadas como JSON. Cualquier cosa rota o de una
 * versión vieja cae al default en vez de tirar: las notificaciones son
 * accesorias, y una preferencia corrupta no puede impedir que la app abra.
 */
export function parseReminderSettings(raw: string | null): ReminderSettings {
  if (!raw) return DEFAULT_REMINDER_SETTINGS;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_REMINDER_SETTINGS;
  }
  if (typeof parsed !== "object" || parsed === null) return DEFAULT_REMINDER_SETTINGS;

  const value = parsed as Partial<Record<keyof ReminderSettings, unknown>>;
  const bool = (key: keyof ReminderSettings) =>
    typeof value[key] === "boolean" ? (value[key] as boolean) : DEFAULT_REMINDER_SETTINGS[key];

  return {
    periodSoon: bool("periodSoon") as boolean,
    fertileWindow: bool("fertileWindow") as boolean,
    dailyLog: bool("dailyLog") as boolean,
    discreet: bool("discreet") as boolean,
    daysBefore: clampDaysBefore(
      typeof value.daysBefore === "number" ? value.daysBefore : DEFAULT_REMINDER_SETTINGS.daysBefore
    ),
    hour: clampHour(typeof value.hour === "number" ? value.hour : DEFAULT_REMINDER_SETTINGS.hour),
  };
}

/** ¿Hay al menos un recordatorio prendido? */
export function anyReminderEnabled(settings: ReminderSettings): boolean {
  return settings.periodSoon || settings.fertileWindow || settings.dailyLog;
}

/** '9:00', '14:00' — sin ceros a la izquierda, como se lee en español. */
export function formatHour(hour: number): string {
  return `${clampHour(hour)}:00`;
}
