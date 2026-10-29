/**
 * Lógica pura de `delete-account` (sin Deno ni red), separada de `index.ts`
 * para que jest la pruebe en Node.
 */

/** Saca el token de `Authorization: Bearer <jwt>`, o null si no hay uno usable. */
export function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}
