import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { PlannedReminder } from "./reminders";

/**
 * Capa de sistema de los recordatorios: agenda en el SO lo que decidió
 * `lib/reminders.ts`. Acá no hay ninguna regla de negocio — si algo hay que
 * decidir (qué avisar, con qué texto, en qué caso no avisar), va allá, que
 * es lo que está testeado.
 *
 * Es también **el único lugar de la app donde se usa hora local**. El
 * dominio entero trabaja en UTC para que las cuentas no dependan del huso,
 * pero una notificación tiene que sonar a las 10 de la mañana de la persona
 * que la recibe, no a las 10 UTC. La conversión pasa acá y solo acá.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Si la plataforma puede agendar avisos locales. En web es false (ver
 * notifications.web.ts) y la pantalla de recordatorios lo explica en vez de
 * ofrecer controles que no harían nada.
 */
export const REMINDERS_SUPPORTED = true;

const ANDROID_CHANNEL = "recordatorios";

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  // Sin canal, Android 8+ descarta las notificaciones en silencio.
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: "Recordatorios",
    importance: Notifications.AndroidImportance.DEFAULT,
    // Sin vibración ni luz: el aviso es para tenerlo presente, no para
    // interrumpir. Coherente con que el default sea el modo discreto.
    vibrationPattern: [0],
    enableVibrate: false,
  });
}

/**
 * Pide permiso solo si todavía no está resuelto. Volver a pedirlo cuando ya
 * fue denegado no vuelve a mostrar el diálogo del sistema — devuelve que no
 * y listo; la pantalla se encarga de explicar que hay que habilitarlo desde
 * los ajustes del teléfono.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function hasNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

/** Fecha local a la hora pedida, a partir de un 'YYYY-MM-DD' del dominio. */
function localDateAt(date: string, hour: number): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

/**
 * Deja agendado exactamente el plan recibido. Se cancela todo lo anterior
 * primero en vez de intentar reconciliar: el plan se recalcula entero cada
 * vez que cambian los datos, y un aviso viejo que sobreviva a un cambio de
 * fecha es peor que no avisar — llega el día equivocado.
 *
 * La app no agenda ninguna otra notificación, así que cancelar todo no pisa
 * nada de otro origen.
 */
export async function applyReminderPlan(plan: PlannedReminder[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (plan.length === 0) return;

  await ensureAndroidChannel();

  for (const reminder of plan) {
    const content = {
      title: reminder.title,
      body: reminder.body,
      // Sin sonido: el aviso está para verlo cuando la persona mire el
      // teléfono, no para sonar en el medio de una reunión.
      sound: false,
    };

    if (reminder.repeatsDaily) {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: reminder.hour,
          minute: 0,
          channelId: ANDROID_CHANNEL,
        },
      });
      continue;
    }

    if (!reminder.date) continue;
    const when = localDateAt(reminder.date, reminder.hour);
    // Última red: si el plan trajo una fecha que ya pasó (por ejemplo, la
    // app quedó abierta cruzando la medianoche), agendarla la dispararía
    // al instante.
    if (when.getTime() <= Date.now()) continue;

    await Notifications.scheduleNotificationAsync({
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: ANDROID_CHANNEL,
      },
    });
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Cuántos avisos quedaron efectivamente agendados en el sistema. */
export async function countScheduledReminders(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}
