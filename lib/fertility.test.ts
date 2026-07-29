import { getFertilityInfo } from "./fertility";
import { predictCycle, addDays } from "./cycle";

const stats = { avgCycleLength: 28, avgPeriodLength: 5, isEstimated: false };
const LMP = "2026-01-01";
// Con ciclo de 28 y lútea de 14, la ovulación cae el día 14 → 2026-01-14.
const OVULATION = "2026-01-14";

function infoOn(today: string) {
  return getFertilityInfo(predictCycle(LMP, today, stats), today);
}

describe("getFertilityInfo", () => {
  it("el día de ovulación estimada es de máxima probabilidad", () => {
    expect(infoOn(OVULATION).status).toBe("peak");
  });

  it("los dos días previos a la ovulación también son de máxima", () => {
    expect(infoOn(addDays(OVULATION, -1)).status).toBe("peak");
    expect(infoOn(addDays(OVULATION, -2)).status).toBe("peak");
  });

  it("tres días antes ya no es máxima pero sigue dentro de la ventana", () => {
    expect(infoOn(addDays(OVULATION, -3)).status).toBe("fertile");
  });

  it("el inicio de la ventana está dentro de la ventana, no fuera", () => {
    // La ventana arranca 5 días antes de ovular.
    expect(infoOn(addDays(OVULATION, -5)).status).toBe("fertile");
  });

  it("el día después de ovular sigue contando como fértil", () => {
    // El óvulo dura ~24 h, así que la ventana se cierra un día después.
    expect(infoOn(addDays(OVULATION, 1)).status).toBe("fertile");
  });

  it("dos días después de ovular ya está fuera de la ventana", () => {
    expect(infoOn(addDays(OVULATION, 2)).status).toBe("low");
  });

  it("marca 'se viene' en los días previos al inicio de la ventana", () => {
    expect(infoOn(addDays(OVULATION, -7)).status).toBe("approaching");
  });

  it("al principio del ciclo la probabilidad es baja", () => {
    expect(infoOn(LMP).status).toBe("low");
  });

  it("daysUntilWindow es 0 mientras esté dentro de la ventana", () => {
    expect(infoOn(OVULATION).daysUntilWindow).toBe(0);
    expect(infoOn(addDays(OVULATION, -4)).daysUntilWindow).toBe(0);
  });

  it("daysUntilWindow cuenta los días que faltan cuando está afuera", () => {
    // 7 días antes de ovular, la ventana (que abre 5 antes) arranca en 2.
    expect(infoOn(addDays(OVULATION, -7)).daysUntilWindow).toBe(2);
  });

  it("daysUntilOvulation queda negativo una vez que la ovulación pasó", () => {
    expect(infoOn(addDays(OVULATION, 3)).daysUntilOvulation).toBeLessThan(0);
  });
});
