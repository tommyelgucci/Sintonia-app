/**
 * Sistema de diseño de Sintonía.
 *
 * Dos decisiones que sostienen todo lo demás:
 *
 * 1. Paleta cálida y maximalista. El morado saturado y los degradados
 *    violeta/celeste son el default de cualquier plantilla — leen a
 *    "producto genérico". Acá los tonos siguen saliendo de pigmentos:
 *    terracota, oliva, mango, ciruela. Pero ahora van a máxima saturación
 *    y en bloques grandes de color con borde de tinta marcado, no en
 *    tonos apagados de fondo — la paleta anterior era demasiado segura
 *    como para llamar la atención en una pantalla de celular.
 *
 * 2. Serif para lo que se lee, sans para lo que se opera. Fraunces
 *    (serif óptica, con carácter) para títulos y números grandes; Karla
 *    (grotesca humanista) para etiquetas, botones y datos. Las dos van
 *    empaquetadas en el bundle — no se piden a un CDN, así que tampoco
 *    filtran una request por usuaria, coherente con el resto de la app.
 */

export const colors = {
  // Base cálida, no blanco puro. El blanco puro sobre pantalla cansa la
  // vista y lee a clínico. Más profunda que antes para que los bloques de
  // color de encima salten en vez de flotar sobre casi-blanco.
  canvas: "#F3E6D2",
  surface: "#FBF3E7",
  surfaceMuted: "#EADFC9",

  ink: "#241512",
  inkSoft: "#6B5A3F",
  inkFaint: "#7A6549",

  line: "#DBC9A8",
  // Borde grueso de tinta que enmarca tarjetas y bloques de color: es lo
  // que reemplaza la sombra suave de antes como separador principal.
  outline: "#241512",

  // Acento de marca para lo interactivo. Terracota profundo: el mismo
  // pigmento que la fase menstrual, a propósito — es el color que más se
  // repite en la app.
  clay: "#B33B1E",
  clayDeep: "#7A2410",

  // Tonos de fase, ahora saturados de verdad: la fase es parte de la
  // identidad visual, no un matiz de fondo casi imperceptible.
  menstrual: "#B33B1E",
  folicular: "#5F7A2E",
  ovulacion: "#E08A1E",
  lutea: "#6A2C70",

  // Acento neutro (ni cálido ni de fase) para lo informativo, como el
  // calendario.
  slate: "#33465B",

  // Degradados envolventes para las tarjetas héroe (from → to). El stop
  // claro se mantiene más oscuro que el tono sólido de la fase (arriba)
  // porque encima va texto color hueso: un mango o una oliva a máxima luz
  // no sostienen el contraste ni con `onDark` ni con las variantes
  // traslúcidas (`onDarkSoft`, `onDarkFaint`) que usan el saludo y el
  // cuerpo de la tarjeta — el texto vive en la esquina donde el gradiente
  // está en su punto más claro, así que ese extremo es el que tiene que
  // sostener el contraste, no el extremo oscuro.
  gradients: {
    menstrual: ["#94311C", "#6B1F0C"] as const,
    folicular: ["#465D26", "#33421A"] as const,
    ovulacion: ["#784D11", "#6E4310"] as const,
    lutea: ["#7A3580", "#4A1E4F"] as const,
    plum: ["#81442A", "#452312"] as const,
  },

  onDark: "#FBF3E7",
  onDarkSoft: "rgba(251, 243, 231, 0.8)",
  onDarkFaint: "rgba(251, 243, 231, 0.6)",
};

export const fonts = {
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  body: "Karla_400Regular",
  bodyMedium: "Karla_500Medium",
  bodyBold: "Karla_700Bold",
};

/**
 * Escala tipográfica. `eyebrow` es la etiqueta en versalitas con tracking
 * abierto que ordena cada bloque — hace la mitad del trabajo de jerarquía
 * sin necesidad de más peso ni más color.
 */
export const type = {
  hero: { fontFamily: fonts.displayBold, fontSize: 40, lineHeight: 44 },
  // Para títulos de héroe que no son una sola palabra: a 40px cualquier
  // frase de tres palabras se parte en tres líneas en un teléfono angosto.
  heroCompact: { fontFamily: fonts.displayBold, fontSize: 31, lineHeight: 36 },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32 },
  section: { fontFamily: fonts.display, fontSize: 19, lineHeight: 25 },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  bodySmall: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
  },
  numeral: { fontFamily: fonts.displayBold, fontSize: 52, lineHeight: 56 },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 12, md: 18, lg: 24, pill: 999 };

/**
 * El borde grueso de `colors.outline` es el que separa un bloque del
 * fondo ahora; la sombra queda como un apoyo chico, no como el recurso
 * principal — una sombra ancha y difusa es lo que hacía flotar todo y
 * diluía el contraste del borde.
 */
export const shadow = {
  card: {
    shadowColor: "#241512",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  raised: {
    shadowColor: "#241512",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
};
