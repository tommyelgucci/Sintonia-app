import {
  computePregnancyProgress,
  dueDateFromLmp,
  lmpFromDueDate,
  isValidIsoDate,
  PREGNANCY_LENGTH_DAYS,
  MAX_TRACKED_WEEK,
} from "./pregnancy";
import { addDays } from "./cycle";

describe("dueDateFromLmp / lmpFromDueDate", () => {
  it("suma 280 días desde la FUM para la fecha probable de parto", () => {
    expect(dueDateFromLmp("2026-01-01")).toBe(addDays("2026-01-01", PREGNANCY_LENGTH_DAYS));
  });

  it("son inversas entre sí", () => {
    const lmp = "2026-03-15";
    expect(lmpFromDueDate(dueDateFromLmp(lmp))).toBe(lmp);
  });
});

describe("computePregnancyProgress", () => {
  it("el día de la FUM es semana 0 día 0", () => {
    const p = computePregnancyProgress("2026-01-01", "2026-01-01");
    expect(p.week).toBe(0);
    expect(p.dayOfWeek).toBe(0);
  });

  it("a los 7 días es semana 1 día 0", () => {
    const p = computePregnancyProgress("2026-01-01", "2026-01-08");
    expect(p.week).toBe(1);
    expect(p.dayOfWeek).toBe(0);
  });

  it("cuenta día dentro de la semana correctamente", () => {
    const p = computePregnancyProgress("2026-01-01", "2026-01-15"); // 14 días = semana 2 día 0
    expect(p.week).toBe(2);
    const p2 = computePregnancyProgress("2026-01-01", "2026-01-17"); // 16 días = semana 2 día 2
    expect(p2.week).toBe(2);
    expect(p2.dayOfWeek).toBe(2);
  });

  it("último día del primer trimestre es semana 12", () => {
    const p = computePregnancyProgress("2026-01-01", addDays("2026-01-01", 12 * 7));
    expect(p.week).toBe(12);
    expect(p.trimester).toBe("primero");
  });

  it("semana 13 ya es segundo trimestre", () => {
    const p = computePregnancyProgress("2026-01-01", addDays("2026-01-01", 13 * 7));
    expect(p.week).toBe(13);
    expect(p.trimester).toBe("segundo");
  });

  it("semana 26 sigue siendo segundo trimestre, semana 27 ya es tercero", () => {
    const w26 = computePregnancyProgress("2026-01-01", addDays("2026-01-01", 26 * 7));
    const w27 = computePregnancyProgress("2026-01-01", addDays("2026-01-01", 27 * 7));
    expect(w26.trimester).toBe("segundo");
    expect(w27.trimester).toBe("tercero");
  });

  it("calcula los días que faltan para la fecha probable de parto", () => {
    const p = computePregnancyProgress("2026-01-01", "2026-01-01");
    expect(p.daysUntilDueDate).toBe(PREGNANCY_LENGTH_DAYS);
  });

  it("no supera la semana máxima trackeada aunque pase la fecha probable de parto", () => {
    const p = computePregnancyProgress("2026-01-01", addDays("2026-01-01", 50 * 7));
    expect(p.week).toBe(MAX_TRACKED_WEEK);
  });

  it("no da semana negativa si 'today' es anterior a la FUM (dato mal cargado)", () => {
    const p = computePregnancyProgress("2026-06-01", "2026-01-01");
    expect(p.week).toBeGreaterThanOrEqual(0);
  });
});

describe("isValidIsoDate", () => {
  it("acepta una fecha real bien formateada", () => {
    expect(isValidIsoDate("2026-02-20")).toBe(true);
  });

  it("rechaza formato incorrecto", () => {
    expect(isValidIsoDate("20-02-2026")).toBe(false);
    expect(isValidIsoDate("2026/02/20")).toBe(false);
    expect(isValidIsoDate("")).toBe(false);
  });

  it("rechaza fechas calendario inexistentes", () => {
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("2026-00-10")).toBe(false);
  });
});
