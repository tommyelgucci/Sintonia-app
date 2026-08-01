import {
  buildCycleHistory,
  buildMonth,
  cycleDayFor,
  monthLabel,
  normalizeDateParam,
  shiftMonth,
  type CalendarDay,
} from "./calendar";
import type { DailyLog } from "./types";

function log(logDate: string, flow: DailyLog["flow"] = "none"): DailyLog {
  return { logDate, flow, symptoms: [], mood: [], notes: null };
}

function dayFor(days: CalendarDay[], date: string): CalendarDay {
  const found = days.find((d) => d.date === date);
  if (!found) throw new Error(`falta ${date} en la grilla`);
  return found;
}

describe("shiftMonth", () => {
  it("avanza cruzando fin de año", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("retrocede cruzando principio de año", () => {
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });

  it("salta varios meses de una", () => {
    expect(shiftMonth(2026, 3, -5)).toEqual({ year: 2025, month: 10 });
  });
});

describe("monthLabel", () => {
  it("nombra el mes en español", () => {
    expect(monthLabel(2026, 8)).toBe("agosto 2026");
  });
});

describe("buildMonth: grilla", () => {
  const empty = { cycles: [], logs: [], today: "2026-08-01" };

  it("arranca en lunes y termina en domingo", () => {
    const days = buildMonth({ year: 2026, month: 8, ...empty });
    // Agosto 2026 empieza sábado: la grilla arranca el lunes 27 de julio.
    expect(days[0].date).toBe("2026-07-27");
    expect(days[days.length - 1].date).toBe("2026-09-06");
    expect(days.length % 7).toBe(0);
  });

  it("marca como fuera de mes los días de relleno", () => {
    const days = buildMonth({ year: 2026, month: 8, ...empty });
    expect(dayFor(days, "2026-07-31").inMonth).toBe(false);
    expect(dayFor(days, "2026-08-01").inMonth).toBe(true);
  });

  it("cubre febrero de un año bisiesto entero", () => {
    const days = buildMonth({ year: 2028, month: 2, ...empty });
    expect(days.filter((d) => d.inMonth).length).toBe(29);
  });

  it("distingue hoy, pasado y futuro", () => {
    const days = buildMonth({ year: 2026, month: 8, ...empty });
    expect(dayFor(days, "2026-08-01").isToday).toBe(true);
    expect(dayFor(days, "2026-08-01").isFuture).toBe(false);
    expect(dayFor(days, "2026-08-02").isFuture).toBe(true);
    expect(dayFor(days, "2026-07-31").isFuture).toBe(false);
  });
});

describe("buildMonth: marcas del ciclo", () => {
  const cycles = [{ startDate: "2026-06-04" }, { startDate: "2026-07-02" }];

  it("pinta como período registrado los días ya transcurridos del ciclo", () => {
    const days = buildMonth({ year: 2026, month: 7, cycles, logs: [], today: "2026-07-20" });
    expect(dayFor(days, "2026-07-02").marker).toBe("period");
    expect(dayFor(days, "2026-07-06").marker).toBe("period"); // 5 días por default
    expect(dayFor(days, "2026-07-07").marker).not.toBe("period");
  });

  it("marca el inicio de ciclo por separado del resto del sangrado", () => {
    const days = buildMonth({ year: 2026, month: 7, cycles, logs: [], today: "2026-07-20" });
    expect(dayFor(days, "2026-07-02").isCycleStart).toBe(true);
    expect(dayFor(days, "2026-07-03").isCycleStart).toBe(false);
  });

  it("proyecta el próximo período como estimado, no como registrado", () => {
    const days = buildMonth({ year: 2026, month: 7, cycles, logs: [], today: "2026-07-20" });
    // Ciclo medido de 28 días: el próximo inicio cae el 30 de julio.
    expect(dayFor(days, "2026-07-30").marker).toBe("predictedPeriod");
    expect(dayFor(days, "2026-07-30").isCycleStart).toBe(false);
  });

  it("sigue proyectando en meses futuros a los que todavía no se llegó", () => {
    const days = buildMonth({ year: 2026, month: 10, cycles, logs: [], today: "2026-07-20" });
    expect(days.some((d) => d.marker === "predictedPeriod")).toBe(true);
  });

  it("ubica ovulación y ventana fértil alrededor del día 14", () => {
    const days = buildMonth({ year: 2026, month: 7, cycles, logs: [], today: "2026-07-20" });
    expect(dayFor(days, "2026-07-15").marker).toBe("ovulation");
    expect(dayFor(days, "2026-07-14").marker).toBe("fertile");
    expect(dayFor(days, "2026-07-16").marker).toBe("fertile");
    expect(dayFor(days, "2026-07-17").marker).toBeNull();
  });

  it("usa la duración real de cada ciclo pasado, no el promedio", () => {
    // Un ciclo largo (35 días) seguido de uno corto: la ovulación del largo
    // tiene que correrse, no quedar donde la pondría el promedio.
    const irregular = [
      { startDate: "2026-05-01" },
      { startDate: "2026-06-05" }, // 35 días
      { startDate: "2026-07-02" }, // 27 días
    ];
    const days = buildMonth({ year: 2026, month: 5, cycles: irregular, logs: [], today: "2026-07-20" });
    // 35 - 14 = día 21 del ciclo => 21 de mayo.
    expect(dayFor(days, "2026-05-21").marker).toBe("ovulation");
  });

  it("un día con flujo registrado gana sobre la estimación", () => {
    const days = buildMonth({
      year: 2026,
      month: 7,
      cycles,
      logs: [log("2026-07-09", "light")],
      today: "2026-07-20",
    });
    expect(dayFor(days, "2026-07-09").marker).toBe("period");
  });

  it("un registro sin flujo no pinta el día como sangrado", () => {
    const days = buildMonth({
      year: 2026,
      month: 7,
      cycles,
      logs: [log("2026-07-20")],
      today: "2026-07-20",
    });
    expect(dayFor(days, "2026-07-20").marker).not.toBe("period");
    expect(dayFor(days, "2026-07-20").hasLog).toBe(true);
  });

  it("los días del ciclo en curso posteriores a hoy quedan como estimados", () => {
    const days = buildMonth({
      year: 2026,
      month: 7,
      cycles: [{ startDate: "2026-07-19" }],
      logs: [],
      today: "2026-07-20",
    });
    expect(dayFor(days, "2026-07-20").marker).toBe("period");
    expect(dayFor(days, "2026-07-21").marker).toBe("predictedPeriod");
  });

  it("sin ningún ciclo registrado no inventa marcas", () => {
    const days = buildMonth({ year: 2026, month: 7, cycles: [], logs: [], today: "2026-07-20" });
    expect(days.every((d) => d.marker === null)).toBe(true);
  });
});

describe("normalizeDateParam", () => {
  const today = "2026-08-01";

  it("acepta una fecha pasada bien formada", () => {
    expect(normalizeDateParam("2026-07-14", today)).toBe("2026-07-14");
  });

  it("acepta hoy", () => {
    expect(normalizeDateParam(today, today)).toBe(today);
  });

  it("cae a hoy con una fecha futura", () => {
    expect(normalizeDateParam("2026-08-02", today)).toBe(today);
  });

  it("cae a hoy con un día que no existe", () => {
    expect(normalizeDateParam("2026-02-31", today)).toBe(today);
    expect(normalizeDateParam("2026-13-01", today)).toBe(today);
  });

  it("cae a hoy con basura o con un parámetro repetido", () => {
    expect(normalizeDateParam("ayer", today)).toBe(today);
    expect(normalizeDateParam(undefined, today)).toBe(today);
    expect(normalizeDateParam(["2026-07-14", "2026-07-15"], today)).toBe(today);
  });
});

describe("cycleDayFor", () => {
  const cycles = [{ startDate: "2026-06-04" }, { startDate: "2026-07-02" }];

  it("cuenta desde el inicio de ciclo más reciente que precede a la fecha", () => {
    expect(cycleDayFor("2026-07-10", cycles)).toBe(9);
  });

  it("el propio inicio es el día 1", () => {
    expect(cycleDayFor("2026-07-02", cycles)).toBe(1);
  });

  it("no cuenta desde un inicio posterior a la fecha", () => {
    expect(cycleDayFor("2026-06-30", cycles)).toBe(27);
  });

  it("devuelve null antes del primer registro", () => {
    expect(cycleDayFor("2026-05-30", cycles)).toBeNull();
    expect(cycleDayFor("2026-05-30", [])).toBeNull();
  });
});

describe("buildCycleHistory", () => {
  it("devuelve los ciclos del más reciente al más viejo", () => {
    const history = buildCycleHistory(
      [{ startDate: "2026-06-04" }, { startDate: "2026-07-02" }],
      []
    );
    expect(history.map((h) => h.startDate)).toEqual(["2026-07-02", "2026-06-04"]);
  });

  it("mide cada ciclo hasta el inicio siguiente", () => {
    const history = buildCycleHistory(
      [{ startDate: "2026-06-04" }, { startDate: "2026-07-02" }],
      []
    );
    expect(history[1].cycleLength).toBe(28);
  });

  it("deja el ciclo en curso sin duración", () => {
    const history = buildCycleHistory([{ startDate: "2026-07-02" }], []);
    expect(history[0].cycleLength).toBeNull();
  });

  it("infiere la duración del sangrado de los días con flujo", () => {
    const history = buildCycleHistory(
      [{ startDate: "2026-07-02" }],
      [log("2026-07-02", "heavy"), log("2026-07-03", "medium"), log("2026-07-04", "light")]
    );
    expect(history[0].periodLength).toBe(3);
  });

  it("no cuenta el sangrado de un ciclo dentro del anterior", () => {
    const history = buildCycleHistory(
      [{ startDate: "2026-06-04" }, { startDate: "2026-07-02" }],
      [log("2026-06-04", "medium"), log("2026-07-02", "medium")]
    );
    const june = history.find((h) => h.startDate === "2026-06-04")!;
    expect(june.periodLength).toBe(1);
  });

  it("prefiere la duración registrada a mano antes que la inferida", () => {
    const history = buildCycleHistory(
      [{ startDate: "2026-07-02", periodLength: 6 }],
      [log("2026-07-02", "medium")]
    );
    expect(history[0].periodLength).toBe(6);
  });
});
