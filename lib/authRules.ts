/**
 * Reglas de la cuenta: validación y textos. Sin ninguna dependencia de
 * Supabase ni de React Native, igual que el resto del dominio — por eso se
 * puede testear en Node. Lo que habla con el servidor vive en `lib/auth.ts`
 * y usa estas funciones (mismo reparto que reminders.ts / notifications.ts).
 */

export type AuthStatus =
  /** Sin sesión: la app anda igual, pero no se puede vincular. */
  | "none"
  /** Sesión anónima creada por una versión anterior de la app. */
  | "anonymous"
  /** Cuenta con mail confirmado. */
  | "email";

export interface AuthState {
  status: AuthStatus;
  userId: string | null;
  email: string | null;
}

/**
 * Cómo se pidió el código, que decide con qué tipo hay que verificarlo.
 * `claim` es el caso de quien ya tenía sesión anónima: se le agrega el mail
 * al mismo usuario en vez de crear uno nuevo, así **no pierde las
 * conexiones que ya tenía**.
 */
export type CodeMode = "signIn" | "claim";

export const OTP_LENGTH = 6;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Validación deliberadamente laxa: algo@algo.algo. Una regex estricta de
 * RFC rechaza direcciones válidas y no evita ni un typo — quien decide de
 * verdad si el mail existe es el código que llega (o no llega).
 */
export function isValidEmail(raw: string): boolean {
  const email = normalizeEmail(raw);
  if (email.length > 254 || /\s/.test(email)) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(email);
}

export function isValidOtpCode(raw: string): boolean {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(raw.trim());
}

/** El tipo de verificación de Supabase que corresponde a cada modo. */
export function otpTypeFor(mode: CodeMode): "email" | "email_change" {
  return mode === "claim" ? "email_change" : "email";
}

/**
 * Traduce los errores de Supabase, que vienen en inglés y a veces son
 * crípticos. El default no inventa una explicación: dice que no se pudo y
 * deja el texto original, que sirve si hay que reportarlo.
 */
export function authErrorMessage(raw: string | null | undefined): string {
  if (!raw) return "No se pudo completar. Probá de nuevo en un momento.";
  const message = raw.toLowerCase();

  if (message.includes("expired") || (message.includes("invalid") && message.includes("token"))) {
    return "Ese código venció o no es correcto. Pedí uno nuevo.";
  }
  if (message.includes("rate limit") || message.includes("for security purposes")) {
    return "Pediste varios códigos seguidos. Esperá un minuto y volvé a intentar.";
  }
  if (message.includes("already been registered") || message.includes("already registered")) {
    return "Ya hay una cuenta con ese mail. Cerrá la sesión de este teléfono y entrá con ese mail.";
  }
  if (message.includes("signups not allowed")) {
    return "No se pueden crear cuentas nuevas por ahora.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "No hay conexión. Tus datos siguen guardados en el teléfono igual.";
  }
  return `No se pudo completar: ${raw}`;
}
