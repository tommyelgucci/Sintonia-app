import { supabase } from "./supabase";
import type { CycleRecord } from "./types";

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

  await supabase.from("cycles").upsert({
    user_id: user.id,
    start_date: cycle.startDate,
    period_length: cycle.periodLength,
  });
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
