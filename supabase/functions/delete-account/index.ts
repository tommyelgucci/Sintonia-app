// Edge Function de Supabase (Deno). Elimina la cuenta de quien la llama: borra
// al usuario de auth.users con la service key, y el resto (perfil, ciclos,
// registros, señales del flujo, conexiones y preferencias de compartir) cae
// por `on delete cascade` — ver supabase/schema.sql.
//
// Deploy: supabase functions deploy delete-account
// (con verificación de JWT: sin sesión no hay a quién borrar). La identidad
// sale SIEMPRE del token, nunca del cuerpo del pedido: nadie puede borrar la
// cuenta de otra persona.
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseAllowedOrigins, resolveAllowedOrigin } from "../_shared/cors.ts";
import { bearerToken } from "./logic.ts";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const ALLOWED_ORIGINS = parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS"));

function json(status: number, body: unknown, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

Deno.serve(async (req) => {
  const cors = resolveAllowedOrigin(req.headers.get("origin"), ALLOWED_ORIGINS);
  if (!cors.allowed) return json(403, { error: "Origen no permitido." });

  const corsHeaders: Record<string, string> = cors.header
    ? {
        "Access-Control-Allow-Origin": cors.header,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        Vary: "Origin",
      }
    : {};

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Método no permitido." }, corsHeaders);

  const token = bearerToken(req.headers.get("authorization"));
  if (!token) return json(401, { error: "Falta la sesión." }, corsHeaders);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json(401, { error: "Sesión inválida." }, corsHeaders);

  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) {
    // El detalle queda en los logs, no en la respuesta.
    console.error("No se pudo eliminar la cuenta", data.user.id, deleteError.message);
    return json(500, { error: "No se pudo eliminar la cuenta ahora." }, corsHeaders);
  }

  return json(200, { deleted: true }, corsHeaders);
});
