import type { CyclePrediction } from "./cycle";
import type { DailyLog } from "./types";
import { findRelevantArticles } from "./library";

/**
 * Asistente de IA sobre el ciclo. Placeholder: no se conecta a nada todavía
 * (falta EXPO_PUBLIC_ANTHROPIC_API_KEY o, mejor, un proxy server-side —
 * ver nota de seguridad abajo), pero define la forma final para no tener
 * que tocar las pantallas cuando se conecte de verdad.
 */

export interface AskAboutCycleParams {
  question: string;
  prediction: CyclePrediction;
  recentLogs: DailyLog[];
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "El asistente de IA todavía no está configurado. Falta conectar la API de Claude."
    );
    this.name = "AiNotConfiguredError";
  }
}

function formatArticleContext(question: string): string | null {
  const articles = findRelevantArticles(question);
  if (articles.length === 0) return null;

  const blocks = articles.map((a) => {
    const redFlags = a.redFlags
      ? `\nSeñales de alarma (${a.redFlags.intro}): ${a.redFlags.items.join("; ")}.`
      : "";
    const body = a.sections.map((s) => `${s.heading}: ${s.body}`).join("\n");
    return `[${a.title}]\n${body}${redFlags}`;
  });

  return [
    "Artículos relevantes de la biblioteca de Sintonía (para responder con",
    "precisión y en la voz de la app — con rangos en vez de promedios, sin",
    "afirmar diagnóstico, priorizando las señales de alarma si aplican —",
    "sin citarlos literalmente ni mencionar que vienen de una 'biblioteca'):",
    blocks.join("\n\n---\n\n"),
  ].join("\n");
}

function buildContext({ question, prediction, recentLogs }: AskAboutCycleParams): string {
  const logLines = recentLogs
    .slice(0, 14)
    .map(
      (l) =>
        `${l.logDate}: flujo=${l.flow}, síntomas=[${l.symptoms.join(", ")}], ánimo=[${l.mood.join(", ")}], flujo vaginal=[${l.dischargeSigns.join(", ")}]`
    )
    .join("\n");

  const articleContext = formatArticleContext(question);

  return [
    `Día ${prediction.cycleDay} del ciclo, fase: ${prediction.phase}.`,
    `Próximo período estimado: ${prediction.nextPeriodDate} (en ${prediction.daysUntilNextPeriod} días).`,
    `Ventana fértil: ${prediction.fertileWindowStart} a ${prediction.fertileWindowEnd}.`,
    "Últimos registros:",
    logLines || "(sin registros recientes)",
    ...(articleContext ? ["", articleContext] : []),
  ].join("\n");
}

/**
 * Pensado para pegarle a un endpoint propio (no directo a la API de
 * Anthropic desde el cliente): la app pública va a terminar en la Play
 * Store, y una API key de Anthropic embebida en el bundle queda expuesta a
 * cualquiera que lo descompile. Este mismo contexto (buildContext) es lo
 * que ese endpoint le pasaría a Claude como system prompt.
 */
export async function askAboutCycle(params: AskAboutCycleParams): Promise<string> {
  const endpoint = process.env.EXPO_PUBLIC_AI_ENDPOINT;
  if (!endpoint) {
    throw new AiNotConfiguredError();
  }

  const context = buildContext(params);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: params.question, context }),
  });

  if (!response.ok) {
    throw new Error(`El asistente de IA respondió con error ${response.status}`);
  }

  const data = await response.json();
  return data.answer as string;
}
