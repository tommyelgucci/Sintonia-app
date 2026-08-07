import * as SQLite from "expo-sqlite";
import type { CycleRecord, DailyLog, FlowIntensity } from "./types";

/**
 * Almacenamiento local-first: los ciclos y registros diarios viven acá
 * primero, en el dispositivo. Lo que se sincroniza a Supabase es una copia
 * — y solo de los campos que la usuaria decide compartir — nunca la fuente
 * de verdad. Si no hay red o la usuaria nunca configuró una cuenta, la app
 * tiene que seguir funcionando igual.
 */

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("sintonia.db").then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS cycles (
          start_date TEXT PRIMARY KEY,
          period_length INTEGER
        );
        CREATE TABLE IF NOT EXISTS daily_logs (
          log_date TEXT PRIMARY KEY,
          flow TEXT NOT NULL DEFAULT 'none',
          symptoms TEXT NOT NULL DEFAULT '[]',
          mood TEXT NOT NULL DEFAULT '[]',
          discharge_signs TEXT NOT NULL DEFAULT '[]',
          notes TEXT
        );
        CREATE TABLE IF NOT EXISTS pregnancy (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          lmp_date TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS preferences (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
      // discharge_signs se agregó después del esquema inicial. Las
      // instalaciones nuevas ya la traen del CREATE TABLE de arriba; en
      // esas, este ALTER falla con "duplicate column" y se ignora a
      // propósito — es la única forma de agregar una columna a una tabla
      // SQLite que ya existe en el dispositivo de alguien que actualizó la
      // app.
      try {
        await db.execAsync(
          `ALTER TABLE daily_logs ADD COLUMN discharge_signs TEXT NOT NULL DEFAULT '[]'`
        );
      } catch {
        // La columna ya existe.
      }
      return db;
    });
  }
  return dbPromise;
}

export async function addCycleStart(
  startDate: string,
  periodLength: number | null = null
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO cycles (start_date, period_length) VALUES (?, ?)",
    [startDate, periodLength]
  );
}

export async function removeCycleStart(startDate: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM cycles WHERE start_date = ?", [startDate]);
}

export async function listCycles(): Promise<CycleRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ start_date: string; period_length: number | null }>(
    "SELECT start_date, period_length FROM cycles ORDER BY start_date ASC"
  );
  return rows.map((r) => ({ startDate: r.start_date, periodLength: r.period_length }));
}

export async function getLatestCycleStart(): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ start_date: string }>(
    "SELECT start_date FROM cycles ORDER BY start_date DESC LIMIT 1"
  );
  return row?.start_date ?? null;
}

export async function upsertDailyLog(log: DailyLog): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO daily_logs (log_date, flow, symptoms, mood, discharge_signs, notes)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(log_date) DO UPDATE SET
       flow = excluded.flow,
       symptoms = excluded.symptoms,
       mood = excluded.mood,
       discharge_signs = excluded.discharge_signs,
       notes = excluded.notes`,
    [
      log.logDate,
      log.flow,
      JSON.stringify(log.symptoms),
      JSON.stringify(log.mood),
      JSON.stringify(log.dischargeSigns),
      log.notes,
    ]
  );
}

export async function getDailyLog(logDate: string): Promise<DailyLog | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    log_date: string;
    flow: FlowIntensity;
    symptoms: string;
    mood: string;
    discharge_signs: string;
    notes: string | null;
  }>("SELECT * FROM daily_logs WHERE log_date = ?", [logDate]);
  if (!row) return null;
  return {
    logDate: row.log_date,
    flow: row.flow,
    symptoms: JSON.parse(row.symptoms),
    mood: JSON.parse(row.mood),
    dischargeSigns: JSON.parse(row.discharge_signs),
    notes: row.notes,
  };
}

export async function listDailyLogs(): Promise<DailyLog[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    log_date: string;
    flow: FlowIntensity;
    symptoms: string;
    mood: string;
    discharge_signs: string;
    notes: string | null;
  }>("SELECT * FROM daily_logs ORDER BY log_date DESC");
  return rows.map((row) => ({
    logDate: row.log_date,
    flow: row.flow,
    symptoms: JSON.parse(row.symptoms),
    mood: JSON.parse(row.mood),
    dischargeSigns: JSON.parse(row.discharge_signs),
    notes: row.notes,
  }));
}

// Fila única: como mucho hay un embarazo activo trackeado a la vez. El
// CHECK(id = 1) en la tabla ya lo garantiza; el upsert siempre apunta a esa
// misma fila.
export async function setPregnancy(lmpDate: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO pregnancy (id, lmp_date) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET lmp_date = excluded.lmp_date`,
    [lmpDate]
  );
}

export async function getPregnancyLmp(): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ lmp_date: string }>(
    "SELECT lmp_date FROM pregnancy WHERE id = 1"
  );
  return row?.lmp_date ?? null;
}

export async function clearPregnancy(): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM pregnancy WHERE id = 1");
}

/**
 * Preferencias como clave-valor en vez de una tabla por opción. El
 * embarazo tiene tabla propia porque guarda una fecha con la que se
 * calcula; una preferencia que solo prende o apaga algo no justifica una
 * migración cada vez que se agrega una.
 */
export async function setPreference(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO preferences (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

export async function getPreference(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM preferences WHERE key = ?",
    [key]
  );
  return row?.value ?? null;
}
