import { supabase } from "./supabase";
import {
  authErrorMessage,
  normalizeEmail,
  otpTypeFor,
  type AuthState,
  type CodeMode,
} from "./authRules";

/**
 * Cuenta por mail con código de un solo uso.
 *
 * Por qué código de 6 dígitos y no link mágico: el link abre el navegador y
 * tiene que volver a la app por deep link, que es donde se rompe (mail
 * abierto en otro dispositivo, navegador que no respeta el scheme, la app
 * de correo que precarga el link y lo consume antes de que la persona lo
 * toque). El código se copia a mano y funciona igual en los tres targets.
 *
 * Por qué sin contraseña: una contraseña más que recordar, para una app que
 * de todos modos guarda los datos en el dispositivo, es fricción sin nada a
 * cambio. Lo que la cuenta resuelve es solo que el vínculo con otra persona
 * sobreviva a cambiar de teléfono.
 *
 * La cuenta es **opcional**: sin ella la app funciona entera. Solo hace
 * falta para vincularse con alguien y para sincronizar.
 *
 * Las reglas puras (validación, textos de error) están en `authRules.ts`.
 */

export async function getAuthState(): Promise<AuthState> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { status: "none", userId: null, email: null };

  const { user } = session;
  // is_anonymous lo marca Supabase en el token; un usuario anónimo que
  // reclamó su mail deja de serlo conservando el mismo id.
  const anonymous = user.is_anonymous === true || !user.email;

  return {
    status: anonymous ? "anonymous" : "email",
    userId: user.id,
    email: user.email ?? null,
  };
}

/**
 * Manda el código al mail. Devuelve el modo usado, que hay que pasarle
 * después a `verifyEmailCode` para verificar con el tipo correcto.
 */
export async function sendEmailCode(rawEmail: string): Promise<CodeMode> {
  const email = normalizeEmail(rawEmail);
  const current = await getAuthState();

  if (current.status === "anonymous") {
    // Le agrega el mail al usuario anónimo que ya existe: mismo user_id,
    // así las conexiones y los datos sincronizados siguen siendo suyos.
    const { error } = await supabase.auth.updateUser({ email });
    if (error) throw new Error(authErrorMessage(error.message));
    return "claim";
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw new Error(authErrorMessage(error.message));
  return "signIn";
}

export async function verifyEmailCode(
  rawEmail: string,
  code: string,
  mode: CodeMode
): Promise<AuthState> {
  const { error } = await supabase.auth.verifyOtp({
    email: normalizeEmail(rawEmail),
    token: code.trim(),
    type: otpTypeFor(mode),
  });
  if (error) throw new Error(authErrorMessage(error.message));

  const state = await getAuthState();
  if (state.userId) await ensureProfile(state.userId);
  return state;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Crea la fila de `profiles` si falta. La vinculación la necesita para
 * mostrar un nombre del otro lado; el mail no se usa como nombre a
 * propósito, porque se ve en la pantalla de la otra persona.
 */
export async function ensureProfile(userId: string): Promise<void> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (data) return;

  await supabase.from("profiles").insert({
    id: userId,
    display_name: "Usuaria de Sintonía",
  });
}

export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  await supabase.from("profiles").update({ display_name: displayName }).eq("id", userId);
}

export async function getDisplayName(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  return data?.display_name ?? null;
}
