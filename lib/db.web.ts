import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CycleRecord, DailyLog } from "./types";

/**
 * Respaldo local para web. expo-sqlite ~15.0 no tiene backend de web (usa
 * requireNativeModule, que no existe fuera de iOS/Android) — Metro resuelve
 * este archivo en vez de db.ts automáticamente en ese target por la
 * extensión .web.ts, así que las pantallas no necesitan saber cuál corre.
 * Misma API que db.ts, guardada como JSON en AsyncStorage (que sí sabe
 * hablar con localStorage en web).
 */

const CYCLES_KEY = "sintonia_cycles";
const DAILY_LOGS_KEY = "sintonia_daily_logs";
const PREGNANCY_KEY = "sintonia_pregnancy";

async function readCycles(): Promise<CycleRecord[]> {
  const raw = await AsyncStorage.getItem(CYCLES_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function writeCycles(cycles: CycleRecord[]): Promise<void> {
  await AsyncStorage.setItem(CYCLES_KEY, JSON.stringify(cycles));
}

async function readDailyLogs(): Promise<DailyLog[]> {
  const raw = await AsyncStorage.getItem(DAILY_LOGS_KEY);
  // dischargeSigns se agregó después: los registros guardados antes no lo
  // tienen en el JSON, así que acá puede faltar de verdad aunque el tipo
  // lo declare obligatorio. Sin este default, un .map/.filter sobre ese
  // campo en insights.ts o healthReport.ts explota con "undefined is not
  // iterable".
  const logs: Array<Omit<DailyLog, "dischargeSigns"> & { dischargeSigns?: string[] }> = raw
    ? JSON.parse(raw)
    : [];
  return logs.map((l) => ({ ...l, dischargeSigns: l.dischargeSigns ?? [] }));
}

async function writeDailyLogs(logs: DailyLog[]): Promise<void> {
  await AsyncStorage.setItem(DAILY_LOGS_KEY, JSON.stringify(logs));
}

export async function addCycleStart(
  startDate: string,
  periodLength: number | null = null
): Promise<void> {
  const cycles = await readCycles();
  const others = cycles.filter((c) => c.startDate !== startDate);
  others.push({ startDate, periodLength });
  await writeCycles(others);
}

export async function removeCycleStart(startDate: string): Promise<void> {
  const cycles = await readCycles();
  await writeCycles(cycles.filter((c) => c.startDate !== startDate));
}

export async function listCycles(): Promise<CycleRecord[]> {
  const cycles = await readCycles();
  return [...cycles].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function getLatestCycleStart(): Promise<string | null> {
  const cycles = await listCycles();
  return cycles.length ? cycles[cycles.length - 1].startDate : null;
}

export async function upsertDailyLog(log: DailyLog): Promise<void> {
  const logs = await readDailyLogs();
  const others = logs.filter((l) => l.logDate !== log.logDate);
  others.push(log);
  await writeDailyLogs(others);
}

export async function getDailyLog(logDate: string): Promise<DailyLog | null> {
  const logs = await readDailyLogs();
  return logs.find((l) => l.logDate === logDate) ?? null;
}

export async function listDailyLogs(): Promise<DailyLog[]> {
  const logs = await readDailyLogs();
  return [...logs].sort((a, b) => b.logDate.localeCompare(a.logDate));
}

export async function setPregnancy(lmpDate: string): Promise<void> {
  await AsyncStorage.setItem(PREGNANCY_KEY, lmpDate);
}

export async function getPregnancyLmp(): Promise<string | null> {
  return AsyncStorage.getItem(PREGNANCY_KEY);
}

export async function clearPregnancy(): Promise<void> {
  await AsyncStorage.removeItem(PREGNANCY_KEY);
}

export async function setPreference(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(`sintonia_pref_${key}`, value);
}

export async function getPreference(key: string): Promise<string | null> {
  return AsyncStorage.getItem(`sintonia_pref_${key}`);
}
