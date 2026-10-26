/**
 * Reglas de la pantalla del asistente: validación de la pregunta y textos.
 * Puro, sin red ni React Native, como `authRules.ts`; la llamada de verdad
 * vive en `lib/ai.ts`.
 */

// Tiene que coincidir con MAX_QUESTION_CHARS del proxy
// (supabase/functions/ai-proxy/logic.ts): si el cliente deja pasar más, el
// proxy lo rechaza con un 413 que la usuaria no entendería.
export const MAX_QUESTION_CHARS = 500;

/** Sin endpoint no hay asistente: la home no ofrece una función muerta. */
export const AI_SUPPORTED = Boolean(process.env.EXPO_PUBLIC_AI_ENDPOINT);

/** Devuelve el motivo por el que la pregunta no se puede enviar, o null. */
export function validateQuestion(raw: string): string | null {
  const q = raw.trim();
  if (q.length === 0) return "Escribí tu pregunta primero.";
  if (q.length > MAX_QUESTION_CHARS) {
    return `La pregunta es muy larga (máximo ${MAX_QUESTION_CHARS} caracteres).`;
  }
  return null;
}

/**
 * Esto es lo único que sale del dispositivo en la app sin que la usuaria
 * lo habilite campo por campo, así que se dice claro antes de enviar.
 * Refleja lo que arma `buildContext` en `lib/ai.ts`: si ese contexto suma
 * un dato nuevo, este texto se corrige con él.
 */
export const AI_DISCLOSURE =
  "Al preguntar se envía tu pregunta, el día y la fase de tu ciclo y tus " +
  "registros de los últimos 14 días (flujo, síntomas, ánimo y señales del flujo " +
  "vaginal; las notas no) a un servicio de IA para armar la respuesta. No se " +
  "guarda tu nombre ni tu mail.";

export const AI_DISCLAIMER =
  "No reemplaza una consulta médica ni diagnostica. Si algo te preocupa o " +
  "cambió de golpe, consultá con un profesional.";

export const SUGGESTED_QUESTIONS = [
  "¿Por qué me vino más tarde este mes?",
  "¿Es normal que me duela en la ovulación?",
  "¿Qué puedo hacer para los cólicos?",
];
