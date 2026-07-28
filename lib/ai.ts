import type { CyclePrediction } from "./cycle";
import type { DailyLog } from "./types";

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

function buildContext({ prediction, recentLogs }: AskAboutCycleParams): string {
  const logLines = recentLogs
    .slice(0, 14)
    .map(
      (l) =>
        `${l.logDate}: flujo=${l.flow}, síntomas=[${l.symptoms.join(", ")}], ánimo=[${l.mood.join(", ")}]`
    )
    .join("\n");

  return [
    `Día ${prediction.cycleDay} del ciclo, fase: ${prediction.phase}.`,
    `Próximo período estimado: ${prediction.nextPeriodDate} (en ${prediction.daysUntilNextPeriod} días).`,
    `Ventana fértil: ${prediction.fertileWindowStart} a ${prediction.fertileWindowEnd}.`,
    "Últimos registros:",
    logLines || "(sin registros recientes)",
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
