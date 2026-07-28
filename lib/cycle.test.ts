import {
  addDays,
  diffDays,
  computeCycleStats,
  predictCycle,
  DEFAULT_CYCLE_LENGTH,
  DEFAULT_PERIOD_LENGTH,
} from "./cycle";

describe("addDays / diffDays", () => {
  it("suma días cruzando fin de mes", () => {
    expect(addDays("2026-01-30", 3)).toBe("2026-02-02");
  });

  it("calcula la diferencia en días entre dos fechas", () => {
    expect(diffDays("2026-01-01", "2026-01-29")).toBe(28);
  });
});

describe("computeCycleStats", () => {
  it("usa los defaults cuando hay menos de 2 ciclos registrados", () => {
    const stats = computeCycleStats([{ startDate: "2026-01-01" }]);
    expect(stats.avgCycleLength).toBe(DEFAULT_CYCLE_LENGTH);
    expect(stats.avgPeriodLength).toBe(DEFAULT_PERIOD_LENGTH);
    expect(stats.isEstimated).toBe(true);
  });

  it("promedia la duración real del ciclo a partir de 2+ inicios", () => {
    const stats = computeCycleStats([
      { startDate: "2026-01-01" },
      { startDate: "2026-01-29" }, // 28 días
      { startDate: "2026-02-28" }, // 30 días
    ]);
    expect(stats.avgCycleLength).toBe(29);
    expect(stats.isEstimated).toBe(false);
  });

  it("promedia la duración del período cuando está disponible", () => {
    const stats = computeCycleStats([
      { startDate: "2026-01-01", periodLength: 4 },
      { startDate: "2026-01-29", periodLength: 6 },
    ]);
    expect(stats.avgPeriodLength).toBe(5);
  });

  it("no depende del orden en que llegan los ciclos", () => {
    const ordered = computeCycleStats([
      { startDate: "2026-01-01" },
      { startDate: "2026-01-29" },
    ]);
    const reversed = computeCycleStats([
      { startDate: "2026-01-29" },
      { startDate: "2026-01-01" },
    ]);
    expect(reversed.avgCycleLength).toBe(ordered.avgCycleLength);
  });
});

describe("predictCycle", () => {
  const stats = { avgCycleLength: 28, avgPeriodLength: 5, isEstimated: false };

  it("día 1 del ciclo es fase menstrual", () => {
    const p = predictCycle("2026-01-01", "2026-01-01", stats);
    expect(p.cycleDay).toBe(1);
    expect(p.phase).toBe("menstrual");
  });

  it("último día de sangrado sigue siendo menstrual", () => {
    const p = predictCycle("2026-01-01", "2026-01-05", stats);
    expect(p.phase).toBe("menstrual");
  });

  it("el día después del período es folicular", () => {
    const p = predictCycle("2026-01-01", "2026-01-06", stats);
    expect(p.phase).toBe("folicular");
  });

  it("ubica la ovulación 14 días antes del próximo período", () => {
    const p = predictCycle("2026-01-01", "2026-01-01", stats);
    // cycleLength 28 - luteal 14 = día 14 de ciclo => 2026-01-14
    expect(p.ovulationDate).toBe("2026-01-14");
    const onOvulation = predictCycle("2026-01-01", "2026-01-14", stats);
    expect(onOvulation.phase).toBe("ovulacion");
  });

  it("la ventana fértil termina un día después de la ovulación", () => {
    const p = predictCycle("2026-01-01", "2026-01-01", stats);
    expect(p.fertileWindowEnd).toBe(addDays(p.ovulationDate, 1));
  });

  it("el día después de la ovulación es fase lútea", () => {
    const p = predictCycle("2026-01-01", "2026-01-15", stats);
    expect(p.phase).toBe("lutea");
  });

  it("predice el próximo período sumando la duración promedio del ciclo", () => {
    const p = predictCycle("2026-01-01", "2026-01-01", stats);
    expect(p.nextPeriodDate).toBe("2026-01-29");
    expect(p.daysUntilNextPeriod).toBe(28);
  });

  it("con ciclos muy cortos, la ovulación no cae dentro del período", () => {
    const shortStats = { avgCycleLength: 21, avgPeriodLength: 6, isEstimated: false };
    const p = predictCycle("2026-01-01", "2026-01-01", shortStats);
    // 21 - 14 = 7, que ya es > periodLength (6), así que no hace falta el piso
    expect(p.ovulationDate).toBe(addDays("2026-01-01", 6));
  });

  it("con ciclos muy cortos y período largo, aplica el piso mínimo tras el período", () => {
    const extreme = { avgCycleLength: 20, avgPeriodLength: 8, isEstimated: false };
    const p = predictCycle("2026-01-01", "2026-01-01", extreme);
    // 20 - 14 = 6, menor que periodLength+1 (9): debe usar el piso, no un día
    // de ovulación que caiga en pleno sangrado.
    expect(p.ovulationDate).toBe(addDays("2026-01-01", 8));
  });

  it("si 'today' quedó después del próximo período esperado, no da un día de ciclo negativo", () => {
    const p = predictCycle("2026-01-01", "2026-02-15", stats); // 45 días después
    expect(p.cycleDay).toBeGreaterThan(0);
  });
});
