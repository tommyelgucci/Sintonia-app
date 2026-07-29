import { useCallback, useEffect, useState } from "react";
import { computePregnancyProgress, type PregnancyProgress } from "./pregnancy";
import { getPregnancyLmp } from "./db";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface PregnancyState {
  loading: boolean;
  progress: PregnancyProgress | null;
}

/**
 * Recalcula el progreso a partir de la FUM guardada localmente. Mismo
 * patrón que useCyclePrediction: `reload` se llama a mano después de
 * activar o salir del modo embarazo, en vez de mantener el estado
 * sincronizado por otros medios.
 */
export function usePregnancy() {
  const [state, setState] = useState<PregnancyState>({ loading: true, progress: null });

  const reload = useCallback(async () => {
    const lmpDate = await getPregnancyLmp();
    if (!lmpDate) {
      setState({ loading: false, progress: null });
      return;
    }
    setState({ loading: false, progress: computePregnancyProgress(lmpDate, todayStr()) });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
