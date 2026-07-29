/**
 * Biblioteca de contenidos.
 *
 * Tres reglas que aplican a todo lo que se escriba acá:
 *
 * 1. Señales de alarma primero cuando existen. Un artículo sobre dolor
 *    que entierra "andá a la guardia si pasa X" en el párrafo doce es
 *    peor que no tenerlo: la persona que más lo necesita es la que menos
 *    va a scrollear. Por eso `redFlags` es un campo aparte y se renderiza
 *    arriba, no una sección más del cuerpo.
 *
 * 2. Rangos, no promedios. "Entre 21 y 35 días" le sirve a quien tiene
 *    ciclos de 33; "28 días" la deja pensando que está rota.
 *
 * 3. Nunca se afirma un diagnóstico ni se sugiere suspender un
 *    tratamiento. Se describe qué suele pasar y qué amerita consulta.
 */

export type ArticleCategory =
  | "cuerpo"
  | "anticoncepcion"
  | "calma"
  | "condiciones"
  | "fertilidad";

export interface ArticleSection {
  heading: string;
  body: string;
  /** Ítems sueltos bajo el párrafo, cuando enumerar lee mejor que un bloque. */
  bullets?: string[];
}

export interface Article {
  id: string;
  category: ArticleCategory;
  title: string;
  summary: string;
  readingMinutes: number;
  /** Cuándo dejar de leer y consultar. Se muestra antes que el cuerpo. */
  redFlags?: { intro: string; items: string[] };
  sections: ArticleSection[];
  /** Nota al pie del artículo, cuando hace falta acotar el alcance. */
  footnote?: string;
}

export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  cuerpo: "Tu cuerpo",
  anticoncepcion: "Anticoncepción",
  calma: "Calma",
  condiciones: "Condiciones",
  fertilidad: "Fertilidad",
};

export const ARTICLES: Article[] = [
  {
    id: "dolor-bajo-vientre",
    category: "cuerpo",
    title: "Dolor de bajo vientre: qué ayuda y cuándo consultar",
    summary:
      "Qué está haciendo el útero cuando duele, qué alivia de verdad y las señales que no conviene esperar.",
    readingMinutes: 4,
    redFlags: {
      intro:
        "Estas señales no son para monitorear en casa. Si aparece alguna, buscá atención médica ahora:",
      items: [
        "Dolor repentino e intenso de un solo lado, sobre todo con náuseas o vómitos",
        "Dolor con fiebre o flujo con olor fuerte",
        "Sangrado que empapa una toalla o tampón por hora, dos horas seguidas",
        "Dolor con mareo fuerte, desmayo o piel fría y pálida",
        "Cualquier dolor fuerte si hay posibilidad de que estés embarazada",
        "Dolor que te despierta de noche o que empeora cada mes en vez de repetirse igual",
      ],
    },
    sections: [
      {
        heading: "Qué está pasando",
        body: "Durante la menstruación el útero se contrae para desprender el endometrio. Esas contracciones las dispara un grupo de sustancias llamadas prostaglandinas, y cuanto más altas están, más fuerte se contrae y más duele. Por eso el dolor suele ser peor el primer día o dos, que es cuando están en su pico.",
      },
      {
        heading: "Qué ayuda, en orden de evidencia",
        body: "No todo lo que circula funciona igual. Esto es lo que más consistentemente muestra efecto:",
        bullets: [
          "Calor local. Una bolsa o almohadilla en el bajo vientre rinde parecido a un analgésico suave, y se puede combinar.",
          "Antiinflamatorios. Los que bloquean prostaglandinas funcionan mejor si se toman apenas empieza el dolor, no cuando ya está instalado. Consultá dosis con quien te atiende.",
          "Movimiento suave. Caminar o estirar ayuda a bastantes personas, aunque cuesta arrancar.",
          "Respiración lenta. No corta el dolor, pero baja la tensión que se suma encima.",
        ],
      },
      {
        heading: "Cuánto dolor es demasiado",
        body: "No hay un número, pero sí un criterio práctico: si el dolor te hace faltar al trabajo o a estudiar, si no cede con analgésicos comunes, o si cambió respecto a cómo era antes, eso amerita consulta. No porque seas exagerada — al contrario, la dismenorrea severa y la endometriosis se diagnostican tarde justamente porque a muchas les dijeron que el dolor fuerte era normal. Un dolor que te frena la vida es un dato clínico, no una cuestión de aguante.",
      },
    ],
    footnote:
      "Esto es información general. Quien te atiende conoce tu historia y puede indicarte lo que a vos te sirve.",
  },
  {
    id: "anticonceptivos-efectos",
    category: "anticoncepcion",
    title: "Anticonceptivos: qué podés llegar a sentir",
    summary:
      "Cómo funciona cada método, qué efectos son de adaptación y cuáles hay que consultar sin esperar.",
    readingMinutes: 6,
    redFlags: {
      intro:
        "Si usás un método con estrógeno (pastilla combinada, anillo o parche), estas señales requieren atención médica inmediata:",
      items: [
        "Dolor en el pecho o falta de aire repentina",
        "Dolor, hinchazón o calor en una pantorrilla",
        "Dolor de cabeza muy fuerte y distinto a los habituales",
        "Pérdida de visión, visión borrosa o ver luces",
        "Dificultad para hablar o debilidad en un lado del cuerpo",
      ],
    },
    sections: [
      {
        heading: "Los efectos de adaptación son reales, y tienen plazo",
        body: "Casi todos los métodos hormonales tienen entre dos y tres meses en los que el cuerpo se acomoda. En ese período es común el sangrado entre períodos, sensibilidad en los pechos, náuseas leves o dolor de cabeza. Que sea esperable no significa que tengas que aguantarlo indefinidamente: si a los tres meses sigue igual, eso ya no es adaptación y se puede cambiar de método.",
      },
      {
        heading: "Métodos con estrógeno y progestágeno",
        body: "Pastilla combinada, anillo vaginal y parche. Suelen regularizar el ciclo y bajar el dolor menstrual.",
        bullets: [
          "Al principio: náuseas, sensibilidad en pechos, manchado.",
          "A tener en cuenta: aumentan levemente el riesgo de trombosis, y ese riesgo sube si fumás, sobre todo pasados los 35. Es la conversación más importante a tener antes de empezar.",
          "El sangrado de la semana de descanso no es una menstruación real, es una respuesta a la caída hormonal.",
        ],
      },
      {
        heading: "Métodos solo con progestágeno",
        body: "Minipíldora, implante, inyección y DIU hormonal. Son opción cuando el estrógeno está contraindicado.",
        bullets: [
          "El cambio más frecuente es en el patrón de sangrado: puede volverse irregular, muy leve, o desaparecer. Que no baje no es peligroso ni significa que se 'acumule' nada.",
          "El implante y el DIU hormonal duran años y no dependen de acordarse todos los días.",
          "La inyección puede tardar más en revertirse cuando se suspende, a veces varios meses.",
        ],
      },
      {
        heading: "DIU de cobre",
        body: "Sin hormonas. No afecta el ciclo ni el ánimo por vía hormonal, pero suele hacer los períodos más abundantes y más dolorosos, sobre todo el primer año. Para quien ya tiene períodos difíciles, ese es el punto a sopesar.",
      },
      {
        heading: "Sobre el ánimo",
        body: "Muchas personas notan cambios de ánimo con métodos hormonales y durante mucho tiempo se les respondió que era sugestión. La evidencia es mixta a nivel poblacional, pero eso no invalida lo que te pasa a vos: los promedios de un estudio no describen a cada persona. Si arrancaste un método y te sentís distinta, es motivo válido de consulta y de probar otra cosa. No hace falta demostrarlo con un estudio.",
      },
    ],
    footnote:
      "No suspendas ni cambies un método por tu cuenta a partir de esto — hablalo con quien te atiende, que puede ver tu historia completa.",
  },
  {
    id: "ansiedad-premenstrual",
    category: "calma",
    title: "Cuando la ansiedad sube antes del período",
    summary:
      "Por qué la fase lútea te cambia el ánimo, dónde está el límite con el TDPM y qué hacer en el momento.",
    readingMinutes: 4,
    sections: [
      {
        heading: "No es en tu cabeza, es en tu sangre",
        body: "En la segunda mitad del ciclo sube la progesterona y, en los últimos días, ella y el estrógeno caen juntas. Esa caída arrastra a la serotonina, que es justamente el sistema sobre el que actúan los antidepresivos. Es la misma palanca. Por eso en esos días la ansiedad, la irritabilidad o el llanto aparecen con menos motivo del habitual: el umbral se corrió, no es que te hayas vuelto insoportable.",
      },
      {
        heading: "Qué suele ayudar en el momento",
        body: "Nada de esto reemplaza tratamiento si hace falta, pero son cosas que se pueden hacer cuando ya estás en el pico:",
        bullets: [
          "Alargar la exhalación. Cuando la exhalación dura más que la inhalación, se activa la rama del sistema nervioso que baja las pulsaciones. Es de los pocos accesos directos que tenemos.",
          "Anotar qué día del ciclo es. Ponerle nombre a la causa cambia la experiencia: 'estoy en día 26' se maneja distinto que 'algo anda mal conmigo'.",
          "Bajar la exigencia de esos días a propósito, si podés. Mover una conversación difícil tres días no es evitarla.",
          "Movimiento, aunque sea poco. Es de lo que más consistentemente aparece en los estudios de síntomas premenstruales.",
        ],
      },
      {
        heading: "Cuándo es más que síndrome premenstrual",
        body: "Alrededor del 5% de las personas que menstrúan tienen trastorno disfórico premenstrual (TDPM): los mismos días, pero con una intensidad que rompe vínculos, trabajo o estudio, a veces con desesperanza profunda. La diferencia no es el tipo de síntoma sino cuánto te frena. Si todos los meses perdés días enteros, o si aparecen pensamientos de no querer estar, eso tiene tratamiento específico y no hay que atravesarlo a pulmón. Registrar dos o tres ciclos y llevar ese registro a la consulta es exactamente lo que hace falta para diagnosticarlo.",
      },
    ],
  },
  {
    id: "ciclo-irregular",
    category: "cuerpo",
    title: "Ciclo irregular: cuándo es esperable y cuándo consultar",
    summary:
      "Qué rango se considera normal, qué lo desacomoda de forma pasajera y qué patrones conviene mirar.",
    readingMinutes: 3,
    sections: [
      {
        heading: "El rango normal es más ancho de lo que se cree",
        body: "Un ciclo de entre 21 y 35 días está dentro de lo esperable, y que varíe unos días de un mes a otro también. El '28 días' es un promedio de referencia, no una regla: tener 33 días de forma estable no es una irregularidad. Lo que más informa no es la duración sino la consistencia — un ciclo largo pero parejo dice algo distinto que uno que salta de 24 a 40.",
      },
      {
        heading: "Cosas que lo desacomodan sin que haya nada roto",
        body: "El eje que regula el ciclo es sensible al contexto, y responde a cosas que no tienen que ver con el aparato reproductor:",
        bullets: [
          "Estrés sostenido, sobre todo si viene con poco sueño",
          "Cambios de peso rápidos, en cualquier dirección",
          "Ejercicio de alta carga sin comer acorde",
          "Enfermedades, viajes largos con cambio de huso horario",
          "Los meses después de dejar un método hormonal",
          "Los primeros años después de la primera menstruación y los de la perimenopausia",
        ],
      },
      {
        heading: "Qué sí conviene consultar",
        body: "Que falten períodos tres meses seguidos sin embarazo; que los ciclos pasen a durar menos de 21 o más de 35 días de forma sostenida; sangrado entre períodos que se repite; o un cambio marcado respecto de lo que era tu normal. Nada de eso significa que haya algo grave, pero son los patrones que ameritan que alguien los mire. El reporte que exporta esta app está pensado justo para esa conversación.",
      },
    ],
  },
  {
    id: "buscar-embarazo",
    category: "fertilidad",
    title: "Buscar embarazo: cuándo es más probable",
    summary:
      "Cómo funciona la ventana fértil, qué tan confiable es predecirla por calendario y cuándo conviene consultar.",
    readingMinutes: 5,
    sections: [
      {
        heading: "La ventana no es el día de la ovulación",
        body: "Se suele pensar que hay que apuntar al día exacto de ovular, y en realidad los días previos rinden más. Los espermatozoides sobreviven hasta unos cinco días en el tracto, así que los que llegaron antes esperan al óvulo. El óvulo, en cambio, dura cerca de 24 horas. Por eso la ventana se abre unos cinco días antes de ovular y se cierra enseguida después: es asimétrica, y el lado largo está antes.",
      },
      {
        heading: "Dónde están las mejores chances",
        body: "Dentro de esa ventana, la probabilidad no se reparte pareja. Los dos días previos a la ovulación y el día mismo concentran la mayor parte. Apuntar a esos días, o simplemente tener relaciones cada uno o dos días durante toda la ventana, es lo que muestra mejores resultados — y esto último ahorra la presión de tener que acertarle a una fecha.",
      },
      {
        heading: "Qué tan confiable es esta predicción",
        body: "Es una estimación a partir de tus ciclos anteriores, y conviene tomarla como tal. La ovulación real se corre bastante de un mes a otro, incluso en ciclos que parecen regulares: estudios que la midieron con hormonas encontraron que el día de ovulación varía en la mayoría de las personas. Si querés más precisión, hay dos señales que se leen del cuerpo mismo:",
        bullets: [
          "Moco cervical: cerca de la ovulación se vuelve transparente y elástico, parecido a la clara de huevo. Es la señal que anticipa, no la que confirma.",
          "Temperatura basal: sube unas décimas después de ovular. Confirma que pasó, no avisa antes — sirve para conocer tu patrón a lo largo de varios ciclos.",
          "Tests de ovulación en orina: detectan el pico de LH, que precede a la ovulación por unas 36 horas.",
        ],
      },
      {
        heading: "Cuánto es normal que tarde",
        body: "Alrededor del 85% de las parejas concibe dentro del primer año intentando. Que no pase en dos o tres meses es completamente esperable y no significa nada. Eso sí, si tenés menos de 35 años y pasó un año sin lograrlo, o si tenés 35 o más y pasaron seis meses, esa es la marca en la que conviene consultar — no porque haya algo mal, sino porque los estudios iniciales son simples y empezar antes amplía las opciones. Si tus ciclos son muy irregulares o ausentes, conviene consultar sin esperar ese plazo.",
      },
      {
        heading: "Lo que esta pantalla no es",
        body: "Este cálculo sirve para orientar la búsqueda de embarazo, no para evitarlo. Como método anticonceptivo el calendario falla seguido, justamente porque la ovulación se mueve y los espermatozoides duran varios días. No hay 'días seguros' confiables acá, y por eso la app no los muestra.",
      },
    ],
    footnote:
      "Registrar unos meses de ciclos antes de la consulta le da a quien te atienda bastante más con qué trabajar.",
  },
  {
    id: "somp",
    category: "condiciones",
    title: "SOMP, el nuevo nombre del SOP: qué cambió y qué no",
    summary:
      "Desde mayo de 2026 el síndrome de ovario poliquístico se llama distinto. Por qué cambió, cómo se diagnostica y qué se puede hacer.",
    readingMinutes: 6,
    sections: [
      {
        heading: "Cambió el nombre, no el diagnóstico",
        body: "En mayo de 2026 se publicó en The Lancet un consenso global que le cambió el nombre: lo que se conocía como síndrome de ovario poliquístico (SOP) pasó a llamarse síndrome ovárico metabólico poliendocrino — SOMP en español, PMOS en inglés. No lo decidió un grupo chico: participaron 56 organizaciones académicas, clínicas y de pacientes, con encuestas que respondieron más de 14.300 personas con el síndrome y profesionales de todas las regiones del mundo.",
      },
      {
        heading: "Por qué el nombre viejo hacía daño",
        body: "Porque describía mal lo que pasa. Los 'quistes' que se ven en la ecografía no son quistes: son folículos detenidos, estructuras normales que no llegaron a ovular. Y ni siquiera hacen falta para tener el síndrome — se diagnostica sin ningún hallazgo ecográfico. El problema no era estético: el consenso señala que ese nombre venía retrasando diagnósticos, fragmentando la atención y sosteniendo estigma, porque enfocaba en el ovario un cuadro que es hormonal y metabólico. El nombre nuevo lo dice: poliendocrino por los varios ejes hormonales, metabólico por el peso cardiometabólico, y ovárico porque el ovario sigue estando involucrado.",
      },
      {
        heading: "Si tu diagnóstico dice SOP",
        body: "Sigue siendo válido y no hay que rehacer nada. Es la misma condición con otro nombre, y durante un tiempo vas a ver los dos términos conviviendo: en estudios viejos, en historias clínicas, en la mayoría de los buscadores. Si buscás información, probá con los dos. Y si quien te atiende todavía dice SOP, no significa que esté desactualizado: los cambios de nomenclatura tardan años en asentarse en la práctica.",
      },
      {
        heading: "Cómo se diagnostica",
        body: "Se necesitan al menos dos de estos tres criterios, y hay que descartar otras causas que dan un cuadro parecido (tiroides y prolactina, entre otras):",
        bullets: [
          "Ciclos que se espacian o se ausentan, por falta de ovulación",
          "Signos de andrógenos elevados: por análisis de sangre, o clínicos como acné persistente o vello en patrón masculino",
          "Ovarios con muchos folículos pequeños en la ecografía",
        ],
      },
      {
        heading: "Por qué es metabólico y no solo ginecológico",
        body: "En buena parte de los casos hay resistencia a la insulina por detrás: el cuerpo produce más insulina para lograr el mismo efecto, y esa insulina alta estimula al ovario a producir más andrógenos, lo que a su vez interfiere con la ovulación. Es un circuito, y entender que arranca en el metabolismo explica por qué el abordaje no es solo hormonal y por qué se controla también azúcar, presión y lípidos. Esto además pasa en personas de cualquier peso — el SOMP en cuerpos delgados existe y se diagnostica todavía más tarde.",
      },
      {
        heading: "Qué se puede hacer",
        body: "Tiene tratamiento y bastantes caminos según qué te esté afectando más: regularizar ciclos, tratar el acné o el vello, mejorar la sensibilidad a la insulina, o inducir la ovulación si estás buscando embarazo. Tener SOMP no significa que no puedas quedar embarazada; sí suele significar que hace falta acompañamiento para lograrlo. Lo que más rinde a largo plazo es el seguimiento sostenido, porque es un cuadro que cambia con los años.",
      },
    ],
    footnote:
      "Si sospechás que podrías tenerlo, registrar tus ciclos unos meses y llevar ese registro a una consulta acelera bastante el proceso. El nombre nuevo es de mayo de 2026, así que buena parte de lo que encuentres online todavía va a decir SOP.",
  },
];

export function getArticle(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id);
}
