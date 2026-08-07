# Rumbo

Hacia dónde va Sintonía y qué principios no se negocian al agregar algo
nuevo. `CLAUDE.md` explica *cómo* está armado el código; esto explica
*por qué* se armó así y qué decisiones de producto vienen de arrastre.

## Qué es

App de seguimiento de ciclo menstrual, salud hormonal y planificación
inclusiva. Pensada para vincular perfiles — pareja, amiga, red de apoyo —
sin asumir ninguna configuración de género en particular, y con
privacidad primero: los datos del ciclo viven en el dispositivo y solo
se comparte lo que cada usuaria habilita explícitamente.

## Principios que no se negocian

1. **Privacidad primero.** Local-first de verdad, no de marketing: la
   app funciona completa sin cuenta ni red. Lo que sincroniza a la nube
   es una copia, nunca la fuente de verdad, y nada se comparte con una
   persona vinculada salvo que la dueña de ese dato lo habilite,
   categoría por categoría (fechas de ciclo, síntomas, ánimo — cada una
   por separado). Un dato más sensible que el resto (como el flujo
   vaginal) puede sincronizar como backup propio y aun así quedar
   afuera de lo que ve la pareja, aunque el permiso general esté
   activado — esa es la vara: cada dato nuevo se evalúa solo, no hereda
   el nivel de exposición de la categoría más parecida.

2. **Sin roles de género fijos.** Ni en el modelo de datos (`connections`
   es simétrica, sin "partner_a/partner_b") ni en el copy. Cualquier
   persona puede vincularse con cualquier otra.

3. **Tono sin juicio.** Nada de rojo-alarma para "irritable", nada de
   copy que dé por sentado que un síntoma fuerte es exagerar. El dolor
   que frena la vida es un dato clínico, no una cuestión de aguante —
   ese principio, tomado literalmente del artículo de dolor menstrual,
   aplica a cómo se escribe toda la app.

4. **Contenido médico que orienta, no que diagnostica.** Señales de
   alarma primero (arriba del cuerpo del artículo, no enterradas).
   Rangos en vez de un promedio único ("21 a 35 días", no "28 días").
   Nunca se afirma un diagnóstico ni se sugiere suspender un
   tratamiento — se describe qué suele pasar y cuándo amerita consulta.

5. **Sistema de diseño propio.** Paleta cálida y desaturada (arcilla,
   salvia, ámbar, ciruela) en vez del violeta/celeste genérico de
   plantilla. Sin emoji en ningún lado de la interfaz — un glifo propio
   en SVG es consistente entre iOS, Android y web; un emoji no.

## Qué existe hoy

- **Ciclo y predicción**: fase actual, ventana fértil, próximo período,
  a partir del historial cargado (`lib/cycle.ts`).
- **Registro diario**: flujo, síntomas físicos, ánimo, flujo vaginal
  (color/textura/olor distintos a lo habitual) y notas privadas.
- **Modo embarazo**: semana gestacional y tarjeta de progreso.
- **Modo "buscando embarazo"**: ventana fértil al frente de la pantalla
  principal en vez de la fase del ciclo.
- **Vinculación de pareja/red de apoyo**: código + QR, cada categoría de
  dato se comparte por separado y por conexión.
- **Biblioteca de contenidos**: dolor de bajo vientre, anticonceptivos,
  ansiedad premenstrual, ciclo irregular, buscar embarazo, SOMP (ex SOP),
  flujo vaginal — más una guía de respiración.
- **Reporte de salud en PDF**: para llevar a una consulta médica, armado
  100% en el dispositivo.
- **Estadísticas**: tendencia de duración de ciclo, síntomas/ánimo/flujo
  vaginal más frecuentes, y qué tan seguido se registra.

## Qué falta / hacia dónde sigue

Heredado de `README.md` y de conversaciones de producto, sin resolver
todavía:

- Login real — hoy la vinculación de pareja usa sesión anónima de
  Supabase, suficiente para el MVP pero no para producción.
- Conectar `lib/ai.ts` a un endpoint propio que hable con la API de
  Claude (el módulo ya tiene la forma lista, falta el backend).
- Notificaciones: recordatorio de período próximo, de tomar
  anticonceptivo.
- Publicación en Play Store / App Store — falta configurar EAS Build.

Este archivo se actualiza cuando cambia una decisión de principio o se
cierra/abre una línea de "qué falta" — no en cada commit. Para el detalle
de qué se hizo y cuándo, ver `Checkpoint.md`.
