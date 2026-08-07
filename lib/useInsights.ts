import { useCallback, useEffect, useState } from "react";
import { buildCycleInsights, type CycleInsights } from "./insights";
import { listCycles, listDailyLogs } from "./db";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface InsightsState {
  loading: boolean;
  insights: CycleInsights | null;
}

/**
 * Igual patrón que useCyclePrediction: recalcula desde lo guardado
 * localmente y expone `reload` para las pantallas que escriben datos
 * nuevos, en vez de mantener el estado sincronizado a mano.
 */
export function useInsights() {
  const [state, setState] = useState<InsightsState>({ loading: true, insights: null });

  const reload = useCallback(async () => {
    const [cycles, logs] = await Promise.all([listCycles(), listDailyLogs()]);
    setState({ loading: false, insights: buildCycleInsights(cycles, logs, todayStr()) });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
