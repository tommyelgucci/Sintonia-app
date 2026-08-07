import { supabase } from "./supabase";
import type { CycleRecord, DailyLog } from "./types";

/**
 * Puente entre el almacenamiento local (fuente de verdad) y Supabase.
 * Se llama explícitamente después de guardar localmente — nunca al revés
 * — y solo tiene efecto si hay sesión iniciada. Sin sesión, la app sigue
 * siendo 100% local y no manda nada a la red.
 */

export async function pushCycleToCloud(cycle: CycleRecord): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // onConflict apunta al unique(user_id, start_date) del schema, no a la PK
  // (id autogenerado): sin esto, Postgres nunca encuentra conflicto sobre
  // "id" y cada guardado del mismo día inserta una fila nueva en vez de
  // actualizar, hasta romper el unique constraint en el segundo intento.
  await supabase
    .from("cycles")
    .upsert(
      {
        user_id: user.id,
        start_date: cycle.startDate,
        period_length: cycle.periodLength,
      },
      { onConflict: "user_id,start_date" }
    );
}

/**
 * Borra un inicio de ciclo de la nube. Corregir una fecha mal cargada
 * localmente no alcanza: si quedó sincronizada, la pareja vinculada sigue
 * viendo el ciclo equivocado y la corrección se siente como que no funcionó.
 */
export async function removeCycleFromCloud(startDate: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("cycles").delete().eq("user_id", user.id).eq("start_date", startDate);
}

export async function pushDailyLogToCloud(log: DailyLog): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("daily_logs")
    .upsert(
      {
        user_id: user.id,
        log_date: log.logDate,
        flow: log.flow,
        symptoms: log.symptoms,
        mood: log.mood,
        notes: log.notes,
      },
      { onConflict: "user_id,log_date" }
    );
}

/**
 * Últimos registros diarios de una pareja vinculada. RLS ya filtra en el
 * server según su share_settings (share_symptoms / share_mood, ver
 * schema.sql) — si no comparte nada, esto devuelve simplemente vacío, sin
 * que el cliente necesite saber por qué.
 */
export async function fetchPartnerDailyLogs(partnerId: string): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("log_date, flow, symptoms, mood, notes")
    .eq("user_id", partnerId)
    .order("log_date", { ascending: false })
    .limit(14);
  if (error || !data) return [];

  return data.map((row) => ({
    logDate: row.log_date,
    flow: row.flow,
    symptoms: row.symptoms ?? [],
    mood: row.mood ?? [],
    notes: row.notes,
  }));
}

export interface PartnerCycleView {
  partnerId: string;
  displayName: string;
  cycles: CycleRecord[];
}

/**
 * Trae los ciclos de las conexiones aceptadas que además hayan activado
 * share_cycle_dates. RLS ya filtra esto en el server (ver schema.sql); acá
 * solo se arma la respuesta agrupada por persona.
 */
export async function fetchPartnerCycles(): Promise<PartnerCycleView[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: connections, error: connError } = await supabase
    .from("connections")
    .select("requester_id, addressee_id, status")
    .eq("status", "accepted");
  if (connError || !connections) return [];

  const partnerIds = connections
    .map((c) => (c.requester_id === user.id ? c.addressee_id : c.requester_id))
    .filter((id) => id !== user.id);
  if (partnerIds.length === 0) return [];

  const [{ data: profiles }, { data: cycles }] = await Promise.all([
    supabase.from("profiles").select("id, display_name").in("id", partnerIds),
    supabase
      .from("cycles")
      .select("user_id, start_date, period_length")
      .in("user_id", partnerIds),
  ]);

  return (profiles ?? []).map((profile) => ({
    partnerId: profile.id,
    displayName: profile.display_name,
    cycles: (cycles ?? [])
      .filter((c) => c.user_id === profile.id)
      .map((c) => ({ startDate: c.start_date, periodLength: c.period_length })),
  }));
}
