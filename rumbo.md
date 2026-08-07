# Rumbo

Dónde está Sintonía y hacia dónde va. Este archivo es el estado del
producto; `CLAUDE.md` es cómo está construido.

Última actualización: agosto 2026.

## De qué se trata

Una app de ciclo menstrual que no trata a la usuaria como un dato de
fertilidad ni como un problema a corregir.

Tres cosas la diferencian de lo que ya existe:

- **Privacidad de verdad, no de landing.** Los datos viven en el
  dispositivo. La cuenta es opcional y lo que se comparte se habilita a
  mano, campo por campo. Nada de anuncios ni de vender datos de ciclo.
- **Vinculación sin roles fijos.** Pareja, amiga o red de apoyo. El schema
  no tiene género y la relación es simétrica: cualquiera invita, cualquiera
  acepta.
- **Tono sin juicio.** La app explica lo que está pasando en el cuerpo, no
  felicita por registrar ni reta por no hacerlo. El contenido de la
  biblioteca está para el momento en que aparece el síntoma, no para
  buscarlo después.

Acompaña tres momentos distintos, no uno: seguir el ciclo, buscar embarazo
y estar embarazada. Se cambia entre ellos desde la home y cada uno reordena
lo que se ve primero.

## Hecho

- Predicción de ciclo (fase, ovulación, ventana fértil, próximo período)
  que se ajusta sola a medida que hay más datos.
- Registro diario: flujo, síntomas, ánimo y notas.
- **Calendario mensual e historial**: ver el mes, completar días hacia
  atrás, corregir un inicio mal cargado, revisar la duración de cada ciclo.
- **Recordatorios** de período próximo, ventana fértil y registro diario,
  con modo discreto prendido por default. Solo en Android/iOS: el navegador
  no puede avisar con la pestaña cerrada.
- Vinculación por código o QR, con permisos por conexión.
- **Cuenta por mail** (código de 6 dígitos, sin contraseña), opcional y
  solo necesaria para vincularse. Quien venía de una sesión anónima puede
  reclamar su mail sin perder los vínculos que ya tenía.
- Modo "buscando embarazo" con la ventana fértil al frente.
- Modo embarazo: semana gestacional y contenido por semana.
- Biblioteca de contenidos y guía de respiración.
- Reporte de salud exportable en PDF para llevar a la consulta.
- Sistema de diseño propio (paleta cálida, tipografía serif + grotesca,
  iconos SVG propios).

## Lo próximo, en orden

1. **Asistente con IA.** `lib/ai.ts` ya define la forma. Falta el backend
   propio que hable con la API de Claude (la key no puede ir en el
   cliente). Preguntas sobre el ciclo con el contexto de los registros.
2. **EAS Build y publicación** en Play Store / App Store. Los recordatorios
   son la primera función que **no se puede probar en el navegador**: hasta
   que haya un build nativo, quedan verificados solo por sus tests.
   Pendiente también probar el ingreso por mail de punta a punta contra un
   proyecto de Supabase real (hoy verificado hasta la validación local).

## Ideas sin comprometer

Sin fecha ni prioridad; están acá para no volver a pensarlas de cero.

- Marcar el fin del sangrado. Hoy `periodLength` se infiere de los días con
  flujo registrado; pedirlo explícito daría predicciones mejores, pero
  agrega fricción a la pantalla de registro.
- Editar el registro de un ciclo entero desde el historial.
- Sincronizar los registros diarios que hoy solo se empujan de a uno.
- Contenido específico para perimenopausia y para ciclos con SOMP.
- Widget de pantalla de inicio con el día del ciclo.

## Decisiones tomadas (no volver sobre esto sin motivo nuevo)

- **SQLite local como fuente de verdad**, Supabase como copia. Invertirlo
  rompería el principio de que la app funciona sin cuenta ni red.
- **Nada de anuncios ni analytics de terceros.** Un SDK de tracking en una
  app de ciclo contradice todo lo demás.
- **Sin campo de género en el schema.** No es un descuido: es el punto.
- **La ovulación se cuenta hacia atrás desde el próximo período** (fase
  lútea fija de 14 días), no partiendo el ciclo al medio. Es la parte del
  ciclo con menos variación entre personas.
- **Lo estimado se muestra siempre distinto de lo registrado**, y la app
  aclara cuándo está usando valores por defecto por falta de datos.
- **Las funciones de dominio son puras y testeadas.** Ninguna regla nueva
  entra directamente en un componente.

## Lo que Sintonía no es

- No es un método anticonceptivo. La ventana fértil es una estimación
  estadística y la app lo dice donde corresponde.
- No diagnostica. El reporte de salud existe para llevarle datos ordenados
  a un profesional, no para reemplazarlo.
- No es una red social. La vinculación es entre personas que ya se conocen.
