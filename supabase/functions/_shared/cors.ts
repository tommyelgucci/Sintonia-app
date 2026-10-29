/**
 * CORS cerrado, compartido por las Edge Functions nuevas. Puro, sin Deno:
 * jest lo prueba en Node. (`ai-proxy` tiene su propia copia en `logic.ts`.)
 *
 * Las apps nativas no mandan `Origin`, así que se aceptan; un navegador solo
 * pasa si su origen está en la lista explícita.
 */
export function resolveAllowedOrigin(
  origin: string | null,
  allowed: string[]
): { allowed: boolean; header: string | null } {
  if (origin === null) return { allowed: true, header: null };
  if (allowed.includes(origin)) return { allowed: true, header: origin };
  return { allowed: false, header: null };
}

export function parseAllowedOrigins(env: string | undefined): string[] {
  return (env ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
