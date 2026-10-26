// Edge Function de Supabase (Deno). Proxy del asistente de IA: recibe
// { question, context } de lib/ai.ts y devuelve { answer }. La API key de
// Anthropic vive solo acá, como secret del proyecto — nunca en el bundle.
//
// Deploy: supabase functions deploy ai-proxy --no-verify-jwt
// (no exige sesión: la app funciona sin cuenta; la defensa es el rate limit).
import {
  RateLimiter,
  buildSystemPrompt,
  clientIp,
  parseAllowedOrigins,
  parseBody,
  resolveAllowedOrigin,
} from "./logic.ts";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const MODEL = Deno.env.get("AI_MODEL") ?? "claude-haiku-5-5";
const ALLOWED_ORIGINS = parseAllowedOrigins(Deno.env.get("ALLOWED_ORIGINS"));
const MAX_OUTPUT_TOKENS = 600;
const UPSTREAM_TIMEOUT_MS = 25_000;

// En memoria: vale por instancia de la función, no es global. Frena el abuso
// casual, no uno distribuido; si hace falta más, moverlo a una tabla.
const limiter = new RateLimiter([
  { limit: 6, windowMs: 60_000 },
  { limit: 40, windowMs: 24 * 3_600_000 },
]);

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
        "Access-Control-Allow-Headers": "content-type",
        Vary: "Origin",
      }
    : {};

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Método no permitido." }, corsHeaders);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json(503, { error: "Asistente no configurado." }, corsHeaders);

  const wait = limiter.check(clientIp(req.headers), Date.now());
  if (wait > 0) {
    return json(429, { error: "Demasiadas consultas. Probá de nuevo más tarde." }, {
      ...corsHeaders,
      "Retry-After": String(wait),
    });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json(400, { error: "JSON inválido." }, corsHeaders);
  }
  const parsed = parseBody(raw);
  if (!parsed.ok) return json(parsed.status, { error: parsed.error }, corsHeaders);

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: buildSystemPrompt(parsed.body.context),
        messages: [{ role: "user", content: parsed.body.question }],
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!upstream.ok) {
      // El detalle (puede incluir info de la cuenta) queda en los logs, no en la respuesta.
      console.error("Anthropic respondió", upstream.status, await upstream.text());
      return json(502, { error: "El asistente no pudo responder ahora." }, corsHeaders);
    }

    const data = await upstream.json();
    const answer = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("")
      .trim();
    if (!answer) return json(502, { error: "El asistente no pudo responder ahora." }, corsHeaders);

    return json(200, { answer }, corsHeaders);
  } catch (e) {
    console.error("Fallo llamando a Anthropic", e);
    return json(502, { error: "El asistente no pudo responder ahora." }, corsHeaders);
  }
});
