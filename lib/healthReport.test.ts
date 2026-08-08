import { buildHealthReport, IRREGULARITY_THRESHOLD_DAYS } from "./healthReport";
import { addDays } from "./cycle";
import type { CycleRecord, DailyLog } from "./types";

function log(
  logDate: string,
  symptoms: string[] = [],
  mood: string[] = [],
  dischargeSigns: string[] = []
): DailyLog {
  return { logDate, flow: "medium", symptoms, mood, dischargeSigns, notes: null };
}

describe("buildHealthReport", () => {
  it("sin ciclos en el rango, todo queda en null/vacío sin romper", () => {
    const report = buildHealthReport([], [], 6, "2026-06-01");
    expect(report.cycleCount).toBe(0);
    expect(report.avgCycleLength).toBeNull();
    expect(report.minCycleLength).toBeNull();
    expect(report.maxCycleLength).toBeNull();
    expect(report.isIrregular).toBe(false);
    expect(report.cycles).toEqual([]);
    expect(report.topSymptoms).toEqual([]);
  });

  it("con un solo ciclo no hay brecha que promediar", () => {
    const cycles: CycleRecord[] = [{ startDate: "2026-05-01", periodLength: 5 }];
    const report = buildHealthReport(cycles, [], 6, "2026-06-01");
    expect(report.cycleCount).toBe(1);
    expect(report.avgCycleLength).toBeNull();
    expect(report.cycles[0].lengthToNextCycle).toBeNull();
  });

  it("calcula promedio, mínimo y máximo a partir de las brechas entre ciclos", () => {
    const cycles: CycleRecord[] = [
      { startDate: "2026-01-01", periodLength: 5 },
      { startDate: "2026-01-29", periodLength: 5 }, // 28 días
      { startDate: "2026-02-28", periodLength: 5 }, // 30 días
    ];
    const report = buildHealthReport(cycles, [], 6, "2026-03-01");
    expect(report.avgCycleLength).toBe(29);
    expect(report.minCycleLength).toBe(28);
    expect(report.maxCycleLength).toBe(30);
  });

  it("no marca irregular si la variación está en el umbral o por debajo", () => {
    const cycles: CycleRecord[] = [
      { startDate: "2026-01-01", periodLength: null },
      { startDate: "2026-01-29", periodLength: null }, // 28 días
      { startDate: "2026-02-27", periodLength: null }, // 29 días, variación 1
    ];
    const report = buildHealthReport(cycles, [], 6, "2026-03-01");
    expect(report.isIrregular).toBe(false);
  });

  it("marca irregular si la variación supera el umbral", () => {
    const cycles: CycleRecord[] = [
      { startDate: "2026-01-01", periodLength: null },
      { startDate: "2026-01-22", periodLength: null }, // 21 días
      { startDate: addDays("2026-01-22", IRREGULARITY_THRESHOLD_DAYS + 22), periodLength: null }, // variación > umbral
    ];
    const report = buildHealthReport(cycles, [], 6, "2026-06-01");
    expect(report.isIrregular).toBe(true);
  });

  it("promedia solo los ciclos que tienen periodLength cargado", () => {
    const cycles: CycleRecord[] = [
      { startDate: "2026-01-01", periodLength: 4 },
      { startDate: "2026-01-29", periodLength: null },
      { startDate: "2026-02-26", periodLength: 6 },
    ];
    const report = buildHealthReport(cycles, [], 6, "2026-03-01");
    expect(report.avgPeriodLength).toBe(5);
  });

  it("deja afuera ciclos y registros fuera del rango de meses", () => {
    const cycles: CycleRecord[] = [
      { startDate: "2025-01-01", periodLength: 5 }, // muy viejo
      { startDate: "2026-05-01", periodLength: 5 },
    ];
    const logs: DailyLog[] = [log("2025-01-02", ["Cólicos"]), log("2026-05-02", ["Fatiga"])];
    const report = buildHealthReport(cycles, logs, 3, "2026-06-01");
    expect(report.cycleCount).toBe(1);
    expect(report.cycles[0].startDate).toBe("2026-05-01");
    expect(report.topSymptoms).toEqual([{ label: "Fatiga", count: 1 }]);
  });

  it("cuenta frecuencia de síntomas y ánimo y devuelve los más repetidos primero", () => {
    const logs: DailyLog[] = [
      log("2026-05-01", ["Cólicos", "Fatiga"], ["Irritable"]),
      log("2026-05-02", ["Cólicos"], ["Irritable"]),
      log("2026-05-03", ["Cólicos"], ["Tranquila"]),
    ];
    const report = buildHealthReport([], logs, 6, "2026-06-01");
    expect(report.topSymptoms[0]).toEqual({ label: "Cólicos", count: 3 });
    expect(report.topMoods[0]).toEqual({ label: "Irritable", count: 2 });
  });

  it("cuenta también la frecuencia de señales de flujo vaginal", () => {
    const logs: DailyLog[] = [
      log("2026-05-01", [], [], ["Olor a pescado", "Color gris"]),
      log("2026-05-02", [], [], ["Olor a pescado"]),
      log("2026-05-03", [], [], []),
    ];
    const report = buildHealthReport([], logs, 6, "2026-06-01");
    expect(report.topDischargeSigns[0]).toEqual({ label: "Olor a pescado", count: 2 });
  });
});
