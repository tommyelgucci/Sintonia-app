/**
 * Estado de fertilidad para quien está buscando embarazo.
 *
 * Precisión, que acá importa más que en el resto de la app: esto se
 * calcula desde el calendario, y el calendario estima la ovulación a
 * partir de los ciclos previos. La ovulación real se corre — bastante,
 * incluso en ciclos regulares. Por eso el módulo devuelve ventanas y
 * probabilidad relativa, nunca un "hoy ovulás" ni un porcentaje, que
 * serían precisión inventada.
 *
 * El corolario es que esto no sirve como anticonceptivo. La app lo dice
 * explícito en el artículo, y el módulo no expone nada que sugiera lo
 * contrario (no hay "días seguros").
 */

import { diffDays } from "./cycle";
import type { CyclePrediction } from "./cycle";

export type FertilityStatus = "peak" | "fertile" | "approaching" | "low";

export interface FertilityInfo {
  status: FertilityStatus;
  /** Negativo si la ovulación estimada ya pasó. */
  daysUntilOvulation: number;
  /** 0 si ya está dentro de la ventana. */
  daysUntilWindow: number;
}

// Los espermatozoides sobreviven hasta ~5 días en el tracto, así que la
// ventana empieza antes de ovular; el óvulo dura ~24 h, así que se cierra
// enseguida después. La probabilidad más alta está en los dos días
// previos a la ovulación y el día mismo — no después.
const PEAK_DAYS_BEFORE_OVULATION = 2;
const APPROACHING_LEAD_DAYS = 5;

export function getFertilityInfo(
  prediction: CyclePrediction,
  today: string
): FertilityInfo {
  const daysUntilOvulation = diffDays(today, prediction.ovulationDate);
  const daysUntilWindowStart = diffDays(today, prediction.fertileWindowStart);
  const daysUntilWindowEnd = diffDays(today, prediction.fertileWindowEnd);

  const insideWindow = daysUntilWindowStart <= 0 && daysUntilWindowEnd >= 0;
  const insidePeak =
    daysUntilOvulation <= PEAK_DAYS_BEFORE_OVULATION && daysUntilOvulation >= 0;

  let status: FertilityStatus;
  if (insidePeak) {
    status = "peak";
  } else if (insideWindow) {
    status = "fertile";
  } else if (daysUntilWindowStart > 0 && daysUntilWindowStart <= APPROACHING_LEAD_DAYS) {
    status = "approaching";
  } else {
    status = "low";
  }

  return {
    status,
    daysUntilOvulation,
    daysUntilWindow: insideWindow ? 0 : Math.max(0, daysUntilWindowStart),
  };
}

/**
 * Títulos cortos a propósito: van en el display del héroe, y a más de dos
 * palabras largas se parten en tres líneas en un teléfono angosto y se
 * pisan con el ícono. El matiz va en `detail`, que es texto corrido.
 */
export const FERTILITY_COPY: Record<FertilityStatus, { title: string; detail: string }> = {
  peak: {
    title: "Días más fértiles",
    detail:
      "Según tus ciclos, estos son los días con más chances. Tener relaciones hoy o mañana es lo que más suma.",
  },
  fertile: {
    title: "En tu ventana",
    detail:
      "Todavía no llegaste a los días de mayor probabilidad, pero ya estás dentro de la ventana fértil.",
  },
  approaching: {
    title: "Se viene",
    detail: "Faltan pocos días para que empiece la ventana fértil estimada.",
  },
  low: {
    title: "Fuera de ventana",
    detail:
      "Es poco probable concebir estos días — aunque nunca es cero, porque la ovulación se corre.",
  },
};
