import { useCallback, useEffect, useState } from "react";
import { getAuthState } from "./auth";
import type { AuthState } from "./authRules";

/**
 * Estado de la cuenta. `null` mientras carga: la diferencia entre "todavía
 * no sé" y "no hay sesión" importa, porque mostrar "no tenés cuenta" un
 * segundo antes de descubrir que sí la hay se lee como que se perdió.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState | null>(null);

  const reload = useCallback(async () => {
    setState(await getAuthState());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { state, loading: state === null, reload };
}
