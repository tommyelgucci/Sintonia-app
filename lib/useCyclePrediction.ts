import { useCallback, useEffect, useState } from "react";
import { computeCycleStats, predictCycle, type CyclePrediction } from "./cycle";
import { listCycles } from "./db";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface CycleState {
  loading: boolean;
  prediction: CyclePrediction | null;
  isEstimated: boolean;
  hasAnyData: boolean;
}

/**
 * Recalcula la predicción a partir de lo guardado localmente. Se expone
 * `reload` para que las pantallas la llamen después de escribir un ciclo
 * nuevo, en vez de mantener el estado sincronizado a mano.
 */
export function useCyclePrediction() {
  const [state, setState] = useState<CycleState>({
    loading: true,
    prediction: null,
    isEstimated: true,
    hasAnyData: false,
  });

  const reload = useCallback(async () => {
    const cycles = await listCycles();
    if (cycles.length === 0) {
      setState({ loading: false, prediction: null, isEstimated: true, hasAnyData: false });
      return;
    }
    const stats = computeCycleStats(
      cycles.map((c) => ({
        startDate: c.startDate,
        periodLength: c.periodLength ?? undefined,
      }))
    );
    const lastStart = cycles[cycles.length - 1].startDate;
    const prediction = predictCycle(lastStart, todayStr(), stats);
    setState({ loading: false, prediction, isEstimated: stats.isEstimated, hasAnyData: true });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
