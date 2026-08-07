import {
  anyReminderEnabled,
  buildReminderPlan,
  clampDaysBefore,
  clampHour,
  DEFAULT_REMINDER_SETTINGS,
  formatHour,
  parseReminderSettings,
  type ReminderSettings,
} from "./reminders";
import type { CyclePrediction } from "./cycle";

const prediction: CyclePrediction = {
  cycleDay: 20,
  phase: "lutea",
  ovulationDate: "2026-08-14",
  fertileWindowStart: "2026-08-09",
  fertileWindowEnd: "2026-08-15",
  nextPeriodDate: "2026-08-28",
  daysUntilNextPeriod: 8,
};

function settings(overrides: Partial<ReminderSettings> = {}): ReminderSettings {
  return { ...DEFAULT_REMINDER_SETTINGS, ...overrides };
}

const today = "2026-08-01";

describe("buildReminderPlan", () => {
  it("sin nada prendido no agenda nada", () => {
    const plan = buildReminderPlan({
      settings: settings(),
      prediction,
      intention: "tracking",
      today,
    });
    expect(plan).toEqual([]);
  });

  it("agenda el aviso previo y el del día estimado del período", () => {
    const plan = buildReminderPlan({
      settings: settings({ periodSoon: true, daysBefore: 2 }),
      prediction,
      intention: "tracking",
      today,
    });
    expect(plan.map((r) => [r.kind, r.date])).toEqual([
      ["periodSoon", "2026-08-26"],
      ["periodToday", "2026-08-28"],
    ]);
  });

  it("respeta los días de anticipación elegidos", () => {
    const plan = buildReminderPlan({
      settings: settings({ periodSoon: true, daysBefore: 5 }),
      prediction,
      intention: "tracking",
      today,
    });
    expect(plan.find((r) => r.kind === "periodSoon")?.date).toBe("2026-08-23");
  });

  it("no agenda un aviso cuya fecha ya pasó", () => {
    const plan = buildReminderPlan({
      settings: settings({ periodSoon: true, daysBefore: 2 }),
      prediction,
      intention: "tracking",
      today: "2026-08-27", // el aviso previo era el 26
    });
    expect(plan.map((r) => r.kind)).toEqual(["periodToday"]);
  });

  it("tampoco agenda para hoy mismo", () => {
    const plan = buildReminderPlan({
      settings: settings({ periodSoon: true, daysBefore: 2 }),
      prediction,
      intention: "tracking",
      today: "2026-08-26",
    });
    expect(plan.map((r) => r.kind)).toEqual(["periodToday"]);
  });

  it("la ventana fértil se avisa solo si está buscando embarazo", () => {
    const on = settings({ fertileWindow: true });
    expect(
      buildReminderPlan({ settings: on, prediction, intention: "tracking", today })
    ).toEqual([]);
    const plan = buildReminderPlan({
      settings: on,
      prediction,
      intention: "conceiving",
      today,
    });
    expect(plan.map((r) => [r.kind, r.date])).toEqual([["fertileWindow", "2026-08-09"]]);
  });

  it("en embarazo no agenda ningún aviso de ciclo", () => {
    const plan = buildReminderPlan({
      settings: settings({ periodSoon: true, fertileWindow: true }),
      prediction,
      intention: "pregnant",
      today,
    });
    expect(plan).toEqual([]);
  });

  it("en embarazo sí deja el recordatorio diario de registro", () => {
    const plan = buildReminderPlan({
      settings: settings({ periodSoon: true, dailyLog: true }),
      prediction,
      intention: "pregnant",
      today,
    });
    expect(plan.map((r) => r.kind)).toEqual(["dailyLog"]);
  });

  it("sin predicción no agenda avisos de ciclo", () => {
    const plan = buildReminderPlan({
      settings: settings({ periodSoon: true, fertileWindow: true, dailyLog: true }),
      prediction: null,
      intention: "conceiving",
      today,
    });
    expect(plan.map((r) => r.kind)).toEqual(["dailyLog"]);
  });

  it("el recordatorio diario se repite y no tiene fecha", () => {
    const [daily] = buildReminderPlan({
      settings: settings({ dailyLog: true, hour: 21 }),
      prediction,
      intention: "tracking",
      today,
    });
    expect(daily.repeatsDaily).toBe(true);
    expect(daily.date).toBeNull();
    expect(daily.hour).toBe(21);
  });

  it("sanea una hora fuera de rango en vez de agendar en el limbo", () => {
    const [daily] = buildReminderPlan({
      settings: settings({ dailyLog: true, hour: 47 }),
      prediction,
      intention: "tracking",
      today,
    });
    expect(daily.hour).toBe(23);
  });
});

describe("buildReminderPlan: texto", () => {
  it("el modo discreto no revela de qué se trata", () => {
    const plan = buildReminderPlan({
      settings: settings({ periodSoon: true, dailyLog: true, discreet: true }),
      prediction,
      intention: "tracking",
      today,
    });
    for (const reminder of plan) {
      expect(reminder.title).toBe("Sintonía");
      expect(reminder.body).not.toMatch(/período|fértil|flujo|síntomas/i);
    }
  });

  it("todos los avisos discretos se ven iguales entre sí", () => {
    const plan = buildReminderPlan({
      settings: settings({ periodSoon: true, dailyLog: true, discreet: true }),
      prediction,
      intention: "tracking",
      today,
    });
    const distintos = new Set(plan.map((r) => `${r.title}|${r.body}`));
    expect(plan.length).toBeGreaterThan(1);
    expect(distintos.size).toBe(1);
  });

  it("sin modo discreto el aviso dice qué está pasando", () => {
    const plan = buildReminderPlan({
      settings: settings({ periodSoon: true, discreet: false }),
      prediction,
      intention: "tracking",
      today,
    });
    expect(plan[0].title).toMatch(/período/i);
    expect(plan[0].body).toMatch(/en 2 días/);
  });

  it("con un día de anticipación dice 'mañana', no 'en 1 días'", () => {
    const plan = buildReminderPlan({
      settings: settings({ periodSoon: true, discreet: false, daysBefore: 1 }),
      prediction,
      intention: "tracking",
      today,
    });
    expect(plan[0].body).toMatch(/mañana/);
    expect(plan[0].body).not.toMatch(/1 días/);
  });
});

describe("parseReminderSettings", () => {
  it("sin nada guardado devuelve los defaults", () => {
    expect(parseReminderSettings(null)).toEqual(DEFAULT_REMINDER_SETTINGS);
  });

  it("los recordatorios vienen apagados y el modo discreto prendido", () => {
    expect(anyReminderEnabled(DEFAULT_REMINDER_SETTINGS)).toBe(false);
    expect(DEFAULT_REMINDER_SETTINGS.discreet).toBe(true);
  });

  it("lee lo guardado", () => {
    const stored = JSON.stringify({ periodSoon: true, hour: 8, daysBefore: 3, discreet: false });
    const parsed = parseReminderSettings(stored);
    expect(parsed.periodSoon).toBe(true);
    expect(parsed.hour).toBe(8);
    expect(parsed.daysBefore).toBe(3);
    expect(parsed.discreet).toBe(false);
  });

  it("completa con defaults las claves que falten", () => {
    const parsed = parseReminderSettings(JSON.stringify({ dailyLog: true }));
    expect(parsed.dailyLog).toBe(true);
    expect(parsed.hour).toBe(DEFAULT_REMINDER_SETTINGS.hour);
    expect(parsed.discreet).toBe(true);
  });

  it("ignora valores del tipo equivocado", () => {
    const parsed = parseReminderSettings(JSON.stringify({ periodSoon: "sí", hour: "tarde" }));
    expect(parsed.periodSoon).toBe(false);
    expect(parsed.hour).toBe(DEFAULT_REMINDER_SETTINGS.hour);
  });

  it("no tira con JSON roto ni con un tipo inesperado", () => {
    expect(parseReminderSettings("{no es json")).toEqual(DEFAULT_REMINDER_SETTINGS);
    expect(parseReminderSettings("null")).toEqual(DEFAULT_REMINDER_SETTINGS);
    expect(parseReminderSettings("42")).toEqual(DEFAULT_REMINDER_SETTINGS);
  });

  it("recorta valores fuera de rango", () => {
    const parsed = parseReminderSettings(JSON.stringify({ hour: -5, daysBefore: 99 }));
    expect(parsed.hour).toBe(0);
    expect(parsed.daysBefore).toBe(7);
  });
});

describe("helpers", () => {
  it("clampHour y clampDaysBefore acotan al rango válido", () => {
    expect(clampHour(12)).toBe(12);
    expect(clampHour(NaN)).toBe(DEFAULT_REMINDER_SETTINGS.hour);
    expect(clampDaysBefore(0)).toBe(1);
  });

  it("formatHour escribe la hora sin ceros a la izquierda", () => {
    expect(formatHour(9)).toBe("9:00");
    expect(formatHour(21)).toBe("21:00");
  });
});
