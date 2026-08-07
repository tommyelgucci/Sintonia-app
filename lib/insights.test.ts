import { buildCycleInsights } from "./insights";
import type { CycleRecord, DailyLog } from "./types";

function log(logDate: string, symptoms: string[] = [], mood: string[] = []): DailyLog {
  return { logDate, flow: "medium", symptoms, mood, notes: null };
}

describe("buildCycleInsights", () => {
  it("sin ciclos, todo queda en null/vacío sin romper", () => {
    const insights = buildCycleInsights([], [], "2026-06-01");
    expect(insights.hasEnoughData).toBe(false);
    expect(insights.cycleCount).toBe(0);
    expect(insights.avgCycleLength).toBeNull();
    expect(insights.avgPeriodLength).toBeNull();
    expect(insights.cycleLengthHistory).toEqual([]);
    expect(insights.topSymptoms).toEqual([]);
    expect(insights.trackedDaysCount).toBe(0);
    expect(insights.loggingRate).toBe(0);
  });

  it("con un solo ciclo no hay brecha que promediar, pero sí cuenta como trackeado", () => {
    const cycles: CycleRecord[] = [{ startDate: "2026-05-01", periodLength: 5 }];
    const insights = buildCycleInsights(cycles, [], "2026-05-11");
    expect(insights.hasEnoughData).toBe(false);
    expect(insights.cycleCount).toBe(1);
    expect(insights.avgCycleLength).toBeNull();
    expect(insights.avgPeriodLength).toBe(5);
    expect(insights.cycleLengthHistory).toEqual([]);
    expect(insights.trackedDaysCount).toBe(11);
  });

  it("calcula promedio, mínimo y máximo a partir de las brechas entre ciclos", () => {
    const cycles: CycleRecord[] = [
      { startDate: "2026-01-01", periodLength: 5 },
      { startDate: "2026-01-29", periodLength: 5 }, // 28 días
      { startDate: "2026-02-28", periodLength: 5 }, // 30 días
    ];
    const insights = buildCycleInsights(cycles, [], "2026-03-01");
    expect(insights.hasEnoughData).toBe(true);
    expect(insights.avgCycleLength).toBe(29);
    expect(insights.minCycleLength).toBe(28);
    expect(insights.maxCycleLength).toBe(30);
    expect(insights.cycleLengthHistory).toEqual([
      { startDate: "2026-01-01", length: 28 },
      { startDate: "2026-01-29", length: 30 },
    ]);
  });

  it("recorta el historial de duraciones a los últimos 12 puntos", () => {
    const cycles: CycleRecord[] = Array.from({ length: 15 }, (_, i) => ({
      startDate: `2025-${String(Math.floor(i / 12) + 1).padStart(2, "0")}-${String((i % 12) * 2 + 1).padStart(2, "0")}`,
      periodLength: null,
    }));
    const insights = buildCycleInsights(cycles, [], "2026-06-01");
    expect(insights.cycleLengthHistory.length).toBe(12);
  });

  it("promedia solo los ciclos que tienen periodLength cargado", () => {
    const cycles: CycleRecord[] = [
      { startDate: "2026-01-01", periodLength: 4 },
      { startDate: "2026-01-29", periodLength: null },
      { startDate: "2026-02-26", periodLength: 6 },
    ];
    const insights = buildCycleInsights(cycles, [], "2026-03-01");
    expect(insights.avgPeriodLength).toBe(5);
  });

  it("cuenta frecuencia de síntomas y ánimo, más repetidos primero, sobre todo el historial", () => {
    const logs: DailyLog[] = [
      log("2026-01-01", ["Cólicos", "Fatiga"], ["Irritable"]),
      log("2026-05-02", ["Cólicos"], ["Irritable"]),
      log("2026-05-03", ["Cólicos"], ["Tranquila"]),
    ];
    const insights = buildCycleInsights([], logs, "2026-06-01");
    expect(insights.topSymptoms[0]).toEqual({ label: "Cólicos", count: 3 });
    expect(insights.topMoods[0]).toEqual({ label: "Irritable", count: 2 });
  });

  it("calcula la tasa de registro sobre los días trackeados", () => {
    const cycles: CycleRecord[] = [{ startDate: "2026-05-01", periodLength: 5 }];
    const logs: DailyLog[] = [log("2026-05-01"), log("2026-05-02"), log("2026-05-03")];
    // 2026-05-01 a 2026-05-10: 10 días trackeados, 3 registrados.
    const insights = buildCycleInsights(cycles, logs, "2026-05-10");
    expect(insights.trackedDaysCount).toBe(10);
    expect(insights.loggedDaysCount).toBe(3);
    expect(insights.loggingRate).toBeCloseTo(0.3);
  });

  it("no deja que la tasa de registro pase de 1 aunque haya más logs que días trackeados", () => {
    const cycles: CycleRecord[] = [{ startDate: "2026-05-05", periodLength: 5 }];
    const logs: DailyLog[] = [
      log("2026-04-01"),
      log("2026-04-02"),
      log("2026-05-05"),
      log("2026-05-06"),
    ];
    const insights = buildCycleInsights(cycles, logs, "2026-05-06");
    expect(insights.loggingRate).toBe(1);
  });
});
