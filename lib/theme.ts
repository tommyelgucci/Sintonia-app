/**
 * Sistema de diseño de Sintonía.
 *
 * Dos decisiones que sostienen todo lo demás:
 *
 * 1. Paleta cálida y desaturada. El morado saturado y los degradados
 *    violeta/celeste son el default de cualquier plantilla — leen a
 *    "producto genérico". Acá los tonos salen de pigmentos: arcilla,
 *    salvia, ámbar, ciruela. Desaturados y con algo de tierra, que es lo
 *    que hace que una pantalla se sienta calma en vez de estridente.
 *
 * 2. Serif para lo que se lee, sans para lo que se opera. Fraunces
 *    (serif óptica, con carácter) para títulos y números grandes; Karla
 *    (grotesca humanista) para etiquetas, botones y datos. Las dos van
 *    empaquetadas en el bundle — no se piden a un CDN, así que tampoco
 *    filtran una request por usuaria, coherente con el resto de la app.
 */

export const colors = {
  // Base cálida: hueso, no blanco puro. El blanco puro sobre pantalla
  // cansa la vista y lee a clínico.
  canvas: "#F6F1EA",
  surface: "#FFFFFF",
  surfaceMuted: "#F0E9E0",

  ink: "#2B2028",
  inkSoft: "#6E6169",
  inkFaint: "#9C9198",

  line: "#E4D9CE",

  // Acento de marca para lo interactivo. Arcilla quemada: cálido, con
  // suficiente contraste sobre el hueso para pasar AA en texto.
  clay: "#A6543F",
  clayDeep: "#7E3D2D",

  // Tonos de fase. Desaturados a propósito: la fase es información
  // ambiental, no una alarma.
  menstrual: "#A8484A",
  folicular: "#5F7F5C",
  ovulacion: "#B8823A",
  lutea: "#7C5E80",

  // Degradados envolventes para las tarjetas héroe (from → to).
  gradients: {
    menstrual: ["#8E3B42", "#5A2430"] as const,
    folicular: ["#4F6E50", "#2C4434"] as const,
    ovulacion: ["#9C6B2C", "#5E3B21"] as const,
    lutea: ["#6B4C71", "#3B2A44"] as const,
    plum: ["#4A3350", "#2A1C33"] as const,
  },

  onDark: "#FBF7F2",
  onDarkSoft: "rgba(251, 247, 242, 0.72)",
  onDarkFaint: "rgba(251, 247, 242, 0.45)",
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
 * Sombras suaves y de radio amplio. Una sombra dura marca el borde de la
 * tarjeta; una difusa da la sensación de que flota, que es lo que hace
 * legible la jerarquía sobre un fondo con degradado.
 */
export const shadow = {
  card: {
    shadowColor: "#2B2028",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  raised: {
    shadowColor: "#2B2028",
    shadowOpacity: 0.14,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
};
