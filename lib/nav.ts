import { router } from "expo-router";

/**
 * Volver, o ir a la home si no hay a dónde volver.
 *
 * router.back() no hace nada cuando la pantalla es la primera del stack,
 * y eso pasa de verdad: en web se puede entrar directo a cualquier URL, y
 * el QR de vinculación abre la app en /link. Sin esto, guardar deja a la
 * persona parada en el mismo formulario, como si el botón estuviera roto.
 */
export function goBackOrHome() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace("/");
}
