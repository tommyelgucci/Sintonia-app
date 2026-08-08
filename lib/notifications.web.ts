import type { PlannedReminder } from "./reminders";

/**
 * Recordatorios en web: no hay.
 *
 * expo-notifications no puede agendar avisos locales en un navegador. Lo
 * único parecido serían las Web Push API + un service worker, que necesitan
 * un servidor que empuje: la pestaña cerrada no ejecuta nada, así que un
 * "avisame en 26 días" no sobrevive. Antes que simular que quedó agendado
 * —y que la usuaria confíe en un aviso que nunca va a llegar— acá no se
 * agenda nada y la pantalla lo dice de frente.
 *
 * Misma firma que notifications.ts: Metro resuelve este archivo en web y
 * las pantallas no cambian.
 */

export async function ensureNotificationPermission(): Promise<boolean> {
  return false;
}

export async function hasNotificationPermission(): Promise<boolean> {
  return false;
}

export async function applyReminderPlan(_plan: PlannedReminder[]): Promise<void> {
  // No-op deliberado.
}

export async function cancelAllReminders(): Promise<void> {
  // No-op deliberado.
}

export async function countScheduledReminders(): Promise<number> {
  return 0;
}

/** Ver la constante gemela en notifications.ts. */
export const REMINDERS_SUPPORTED = false;
