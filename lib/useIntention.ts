import { useCallback, useEffect, useState } from "react";
import { getPreference, setPreference, getPregnancyLmp } from "./db";

/**
 * Para qué está usando la app. El embarazo no se guarda acá porque
 * necesita una fecha (vive en su propia tabla); este hook lo lee para
 * poder responder con un solo valor y que las pantallas no tengan que
 * cruzar dos fuentes para saber qué mostrar.
 */
export type Intention = "tracking" | "conceiving" | "pregnant";

const KEY = "intention";

export function useIntention() {
  const [intention, setIntentionState] = useState<Intention>("tracking");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [stored, lmp] = await Promise.all([getPreference(KEY), getPregnancyLmp()]);
    // El embarazo activo manda sobre lo guardado: si hay una fecha
    // cargada, la app está en modo embarazo aunque la preferencia haya
    // quedado en otra cosa de antes.
    setIntentionState(lmp ? "pregnant" : stored === "conceiving" ? "conceiving" : "tracking");
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const setIntention = useCallback(
    async (next: Intention) => {
      await setPreference(KEY, next);
      await reload();
    },
    [reload]
  );

  return { intention, loading, setIntention, reload };
}
