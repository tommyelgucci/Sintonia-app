# Política de privacidad de Sintonía

> **BORRADOR — no publicar tal cual.** Lo redactó un asistente a partir de lo
> que hace el código y no lo revisó nadie con formación legal. Una app de
> salud con datos de ciclo cae bajo reglas estrictas (datos sensibles en
> GDPR y en la ley suiza de protección de datos, políticas de datos de salud
> de Apple y Google). Antes de publicarlo: completar los `[CORCHETES]`,
> resolver los puntos de "Pendientes antes de publicar" (al final) y
> revisarlo con un profesional. Borrar este bloque y la sección de pendientes
> al publicar.

Última actualización: `[FECHA]`

## Quién es responsable

`[NOMBRE O RAZÓN SOCIAL]`, contacto: `[MAIL DE PRIVACIDAD]`.

## La idea general

Los datos que cargás en Sintonía viven en tu dispositivo. La app funciona
entera sin cuenta y sin conexión. Solo si creás una cuenta se guarda una copia
en la nube, y solo lo que vos habilites se comparte con alguien. No hay
anuncios, no hay herramientas de analítica de terceros y no vendemos ni
cedemos tus datos.

## Qué datos trata la app

**Los que cargás vos:** fechas de inicio de período y duración; por día, el
flujo, síntomas, ánimo, señales del flujo vaginal (color, textura u olor
distintos a lo habitual) y notas; la fecha de última menstruación si activás
el modo embarazo; tu objetivo (seguir el ciclo, buscar embarazo o embarazo);
y tus preferencias de recordatorios.

**Los de la cuenta, si la creás:** tu mail, un identificador de usuario y el
nombre con el que querés que te vea una persona vinculada.

**Lo que no pedimos:** nombre real, género, ubicación, contactos, fotos ni
identificadores publicitarios.

Estos son datos de salud. Los tratamos solo para que la app funcione y
siempre con tu decisión: cargarlos, crear una cuenta, vincularte o preguntarle
al asistente son acciones tuyas.

## Dónde se guardan

- **En tu dispositivo (siempre).** Es la fuente de verdad. Si desinstalás la
  app sin tener cuenta, esos datos se borran con ella.
- **En la nube (solo con cuenta).** Si iniciás sesión, la app guarda una copia
  de tus ciclos y registros diarios (incluidas las notas) en Supabase, nuestro
  proveedor de base de datos y autenticación, `[REGIÓN DEL PROYECTO]`. Es un
  respaldo tuyo y es lo que permite vincularte con otra persona. Sin cuenta no
  sale nada del dispositivo, salvo lo de "Asistente de IA" cuando preguntás.

## Cuenta

Es opcional y solo hace falta para vincularte. Entrás con tu mail y un código
de 6 dígitos que te llega por correo, sin contraseña. Usamos tu mail
únicamente para eso.

## Compartir con otra persona (vinculación)

Podés vincularte con una pareja, una amiga o una red de apoyo con un código o
QR; cualquiera de las dos partes puede invitar y aceptar. La vinculación es
simétrica y sin roles.

Por cada conexión decidís qué ve la otra persona: las **fechas de ciclo**
están habilitadas por defecto; **síntomas y ánimo** (y las notas del mismo
registro) solo si los activás. Podés cambiarlo cuando quieras. Las **señales
del flujo vaginal** se guardan en tu copia de la nube pero el servidor no deja
que las lea nadie más que vos, aunque tengas habilitados los síntomas. La
otra persona también ve el nombre que elegiste.

## Asistente de IA

Si usás "Preguntar", la app envía a nuestro servidor intermedio (una función
de Supabase) tu pregunta, el día y la fase de tu ciclo, la fecha estimada del
próximo período y de la ventana fértil, y tus registros de los **últimos 14
días** (flujo, síntomas, ánimo y señales del flujo vaginal; **no las notas**).
Ese servidor se lo pasa a la API de Claude, de Anthropic, para generar la
respuesta, y te la devuelve.

- No enviamos tu nombre ni tu mail con la pregunta.
- Tu dirección IP la ve el servidor intermedio para limitar el uso abusivo
  (un tope de consultas por minuto y por día); no la guardamos.
- No guardamos tus preguntas ni las respuestas. `[REVISAR: confirmar
  retención y uso para entrenamiento según el plan de API contratado con
  Anthropic y enlazar sus condiciones]`.
- Es opcional: no pasa nada de esto si no usás el asistente. Sus respuestas no
  son consejo médico ni diagnóstico.

## Recordatorios

Los avisos (período próximo, ventana fértil, registro diario) se programan
**en tu dispositivo**; no pasan por ningún servidor. Por defecto el modo
discreto está prendido: la notificación no dice de qué se trata en la pantalla
bloqueada. No están disponibles en la versión web.

## Reporte para el médico

El PDF de salud se arma en tu dispositivo y lo compartís vos, por el medio que
elijas. No lo enviamos a ningún lado.

## Lo que no hacemos

Sin anuncios, sin SDK de analítica o de seguimiento de terceros, sin venta ni
cesión de datos, sin perfiles para publicidad.

## Cuánto tiempo guardamos los datos

En tu dispositivo, hasta que los borres o desinstales la app. En la nube, hasta
que se elimine tu cuenta. Los códigos de invitación vencen a los 7 días.

## Tus derechos y cómo borrar tus datos

Podés pedir acceso, rectificación, borrado y portabilidad de tus datos, y
retirar tu consentimiento en cualquier momento, escribiendo a
`[MAIL DE PRIVACIDAD]`. Podés eliminar tu cuenta cuando quieras desde la
app (Cuenta → Eliminar mi cuenta): se borra de la nube tu mail, tu perfil, tus
ciclos, registros (con las notas y las señales del flujo), conexiones y
preferencias de compartir, y no se puede deshacer. Lo que está guardado en tu
teléfono no se toca; si querés borrarlo también, desinstalá la app. Podés
corregir o borrar registros desde la app, y quitar una conexión cuando
quieras.

## Menores

Sintonía no está dirigida a menores de `[EDAD MÍNIMA]` años. `[REVISAR según la
edad mínima que se declare en las tiendas y la normativa aplicable]`.

## Cambios en esta política

Si cambia qué datos tratamos o con quién los compartimos, actualizamos esta
página y la fecha de arriba, y avisamos dentro de la app antes de aplicarlo.

---

## Pendientes antes de publicar (borrar al publicar)

1. **Desplegar y probar el borrado de cuenta.** Ya está en el código
   (`supabase/functions/delete-account` y el botón en la pantalla Cuenta), pero
   falta desplegar la función y probarla con un proyecto real. Apple la exige
   para cualquier app con cuenta (guideline 5.1.1(v)); Google Play además pide
   una URL pública donde se pueda pedir el borrado sin abrir la app.
2. **Texto de la pantalla de registro desactualizado.** `app/log.tsx` dice de
   las notas "Queda en tu dispositivo. Nadie más lo lee.", pero con cuenta las
   notas se sincronizan a la nube y quien tenga habilitados síntomas o ánimo
   las puede ver (`fetchPartnerDailyLogs` las pide). Esta política describe lo
   que pasa de verdad; el texto de `log.tsx` hay que corregirlo para que
   coincida (la pantalla Cuenta ya está corregida).
3. Completar: responsable, mail, fecha, región de Supabase, edad mínima,
   condiciones de Anthropic.
4. Publicarla en una URL pública estable (las dos tiendas la piden) y usar esa
   misma URL en las fichas de las tiendas y dentro de la app.
5. Que las declaraciones de datos de App Store y Google Play coincidan con
   esta política (datos de salud, mail, contenido enviado a un tercero para IA).
