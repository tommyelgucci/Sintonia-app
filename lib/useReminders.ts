import { useCallback, useEffect, useState } from "react";
import { computeCycleStats, predictCycle } from "./cycle";
import { getPreference, getPregnancyLmp, listCycles, setPreference } from "./db";
import { applyReminderPlan, hasNotificationPermission } from "./notifications";
import {
  buildReminderPlan,
  parseReminderSettings,
  type ReminderSettings,
} from "./reminders";
import type { Intention } from "./useIntention";

const KEY = "reminders";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Vuelve a agendar los recordatorios a partir del estado guardado.
 *
 * Se exporta suelta —además de usarse en el hook— porque hay que llamarla
 * cada vez que cambia algo que mueve las fechas: registrar un período nuevo
 * corre la predicción, y el aviso que estaba agendado quedaría avisando el
 * día equivocado. Es barata y idempotente, así que conviene llamarla de más
 * antes que de menos.
 */
export async function rescheduleReminders(): Promise<void> {
  const settings = parseReminderSettings(await getPreference(KEY));

  const [cycles, lmp] = await Promise.all([listCycles(), getPregnancyLmp()]);
  const storedIntention = await getPreference("intention");
  const intention: Intention = lmp
    ? "pregnant"
    : storedIntention === "conceiving"
      ? "conceiving"
      : "tracking";

  const prediction = cycles.length
    ? predictCycle(
        cycles[cycles.length - 1].startDate,
        todayStr(),
        computeCycleStats(
          cycles.map((c) => ({
            startDate: c.startDate,
            periodLength: c.periodLength ?? undefined,
          }))
        )
      )
    : null;

  await applyReminderPlan(
    buildReminderPlan({ settings, prediction, intention, today: todayStr() })
  );
}

export function useReminders() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [granted, setGranted] = useState(false);

  const reload = useCallback(async () => {
    const [stored, permission] = await Promise.all([
      getPreference(KEY),
      hasNotificationPermission(),
    ]);
    setSettings(parseReminderSettings(stored));
    setGranted(permission);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(async (next: ReminderSettings) => {
    // Optimista: el switch tiene que responder en el momento. Si el guardado
    // fallara, el próximo reload lo corrige.
    setSettings(next);
    await setPreference(KEY, JSON.stringify(next));
    await rescheduleReminders();
  }, []);

  return { settings, granted, setGranted, save, reload };
}
