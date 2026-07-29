import type { CyclePhase } from "./cycle";

/**
 * Lo que está pasando en cada fase, explicado sin juicio.
 *
 * Criterio de redacción, porque acá el tono es la función y no un
 * adorno: se nombra la causa fisiológica antes que el síntoma. "Tu
 * estrógeno y tu progesterona vienen cayendo" y después "por eso podés
 * estar más irritable" — en ese orden. Al revés se lee como un reproche
 * ("estás irritable") con una excusa atrás; así se lee como lo que es,
 * un cuerpo funcionando.
 *
 * Nada de imperativos ("relajate", "cuidate"): son órdenes que agregan
 * una tarea más. Se ofrece permiso, no instrucciones.
 */

export interface PhaseNote {
  title: string;
  body: string;
  /** Qué suele aparecer en esta fase. Nombrarlo de antemano evita el "¿me pasa solo a mí?". */
  common: string[];
}

export const PHASE_NOTES: Record<CyclePhase, PhaseNote> = {
  menstrual: {
    title: "Tu cuerpo está haciendo trabajo pesado",
    body: "El estrógeno y la progesterona están en su punto más bajo de todo el ciclo, y el útero se está contrayendo para vaciarse. Que tengas menos energía no es falta de voluntad: literalmente estás gastando más.",
    common: ["Cólicos", "Cansancio", "Necesidad de dormir más", "Menos ganas de socializar"],
  },
  folicular: {
    title: "El estrógeno vuelve a subir",
    body: "A medida que sube el estrógeno suele volver la energía, la claridad para pensar y las ganas de arrancar cosas. Si todavía no lo sentís, tampoco pasa nada — la curva no es igual para todas.",
    common: ["Más energía", "Mejor ánimo", "Piel más estable", "Más ganas de moverte"],
  },
  ovulacion: {
    title: "El pico del ciclo",
    body: "El estrógeno llega a su máximo y se libera el óvulo. Mucha gente se siente más sociable y más segura estos días. También es normal sentir una puntada de un solo lado: es el folículo al liberarse.",
    common: ["Más deseo sexual", "Flujo más elástico", "Puntada de un lado", "Más sensibilidad en los pechos"],
  },
  lutea: {
    title: "Si estás más sensible, hay un motivo",
    body: "Después de ovular sube la progesterona y, hacia el final, caen las dos hormonas de golpe. Esa caída afecta la serotonina — por eso en estos días la ansiedad, la irritabilidad o las ganas de llorar aparecen con menos motivo del habitual. No es que estés exagerando ni que seas difícil: es una caída hormonal medible.",
    common: ["Irritabilidad", "Ansiedad", "Hinchazón", "Antojos", "Sueño alterado"],
  },
};
