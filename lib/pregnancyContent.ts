/**
 * Contenido semanal de referencia (tamaño aproximado y qué está pasando).
 * Son valores "de libro" — igual que DEFAULT_CYCLE_LENGTH en cycle.ts — no
 * reemplazan el control médico. Antes de la semana 4 no hay nada que mostrar
 * todavía (recién se está implantando), así que la tabla arranca ahí.
 */

export interface WeekContent {
  sizeComparison: string;
  blurb: string;
}

const WEEK_CONTENT: Record<number, WeekContent> = {
  4: { sizeComparison: "una semilla de amapola", blurb: "El óvulo fecundado se está implantando en el útero. Recién empieza todo." },
  5: { sizeComparison: "una semilla de sésamo", blurb: "Empiezan a formarse el tubo neural y las bases del corazón." },
  6: { sizeComparison: "un guisante", blurb: "El corazón late por primera vez, aunque todavía no se sienta." },
  7: { sizeComparison: "un arándano", blurb: "Empiezan a esbozarse los brazos y las piernas." },
  8: { sizeComparison: "una frambuesa", blurb: "Todos los órganos principales ya empezaron a formarse." },
  9: { sizeComparison: "una aceituna", blurb: "Deja de llamarse embrión y pasa a llamarse feto." },
  10: { sizeComparison: "una fresa", blurb: "Los dedos de manos y pies empiezan a separarse." },
  11: { sizeComparison: "un higo", blurb: "La cabeza representa casi la mitad del tamaño total." },
  12: { sizeComparison: "una ciruela", blurb: "Empiezan a aparecer los primeros reflejos, aunque todavía no se noten." },
  13: { sizeComparison: "un limón", blurb: "Termina el primer trimestre." },
  14: { sizeComparison: "un durazno", blurb: "Empiezan a formarse las huellas dactilares." },
  15: { sizeComparison: "una manzana", blurb: "Puede empezar a percibir la luz a través de la piel del abdomen." },
  16: { sizeComparison: "un aguacate", blurb: "El corazón ya bombea una cantidad de sangre considerable por día." },
  17: { sizeComparison: "una pera", blurb: "El esqueleto empieza a endurecerse, de cartílago a hueso." },
  18: { sizeComparison: "un alcaucil", blurb: "Empieza a poder escuchar sonidos desde afuera." },
  19: { sizeComparison: "un tomate", blurb: "Se cubre con una capa protectora, el vernix caseoso." },
  20: { sizeComparison: "un plátano", blurb: "Mitad de camino. Puede tragar y practicar la succión." },
  21: { sizeComparison: "una zanahoria", blurb: "El movimiento se vuelve más coordinado — puede que ya lo sientas." },
  22: { sizeComparison: "una calabaza pequeña", blurb: "Las cejas y las pestañas ya están formadas." },
  23: { sizeComparison: "una berenjena grande", blurb: "Puede reaccionar a ruidos fuertes con sobresaltos." },
  24: { sizeComparison: "una mazorca de maíz", blurb: "Los pulmones empiezan a producir surfactante, clave para respirar." },
  25: { sizeComparison: "un nabo", blurb: "Empieza a acumular grasa bajo la piel." },
  26: { sizeComparison: "una lechuga", blurb: "Puede abrir los ojos por primera vez." },
  27: { sizeComparison: "una coliflor", blurb: "Termina el segundo trimestre." },
  28: { sizeComparison: "una berenjena", blurb: "Empieza el tercer trimestre. Ya sueña, en fase REM." },
  29: { sizeComparison: "una calabaza", blurb: "Los huesos están completamente formados, aunque todavía blandos." },
  30: { sizeComparison: "un repollo", blurb: "Puede regular mejor su propia temperatura." },
  31: { sizeComparison: "un coco", blurb: "Los cinco sentidos ya funcionan." },
  32: { sizeComparison: "un melón chico", blurb: "Practica movimientos de respiración, aunque los pulmones no estén listos." },
  33: { sizeComparison: "una piña", blurb: "El sistema inmune empieza a fortalecerse." },
  34: { sizeComparison: "un melón", blurb: "Las uñas ya llegan a la punta de los dedos." },
  35: { sizeComparison: "una sandía chica", blurb: "Los riñones están completamente desarrollados." },
  36: { sizeComparison: "una lechuga romana grande", blurb: "Ya tiene la mayoría de los reflejos de un recién nacido." },
  37: { sizeComparison: "una acelga", blurb: "Se considera 'a término temprano'. Podría nacer en cualquier momento." },
  38: { sizeComparison: "una sandía mediana", blurb: "Sigue ganando peso, a buen ritmo cada semana." },
  39: { sizeComparison: "una sandía", blurb: "Está completamente desarrollado y listo para nacer." },
  40: { sizeComparison: "una sandía pequeña", blurb: "Fecha probable de parto — muy pocos bebés nacen exactamente este día." },
  41: { sizeComparison: "una calabaza grande", blurb: "Se considera embarazo postérmino. El equipo médico va a monitorear de cerca." },
  42: { sizeComparison: "una calabaza grande", blurb: "Postérmino. A esta altura la mayoría de los equipos médicos ya evalúan inducir el parto." },
};

const FIRST_TRACKED_WEEK = 4;
const LAST_TRACKED_WEEK = 42;

export function getWeekContent(week: number): WeekContent {
  if (week < FIRST_TRACKED_WEEK) {
    return {
      sizeComparison: "todavía muy chiquito para verse",
      blurb: "Recién se implantó o está por implantarse. Es normal que todavía no haya nada para mostrar.",
    };
  }
  const clamped = Math.min(week, LAST_TRACKED_WEEK);
  return WEEK_CONTENT[clamped];
}
