# Sintonía

App de seguimiento de ciclo menstrual, salud hormonal y planificación
inclusiva. Pensada para vincular perfiles — pareja, amiga, red de apoyo —
sin asumir ninguna configuración de género en particular, y con privacidad
primero: los datos del ciclo viven en el dispositivo y solo se comparte lo
que cada usuaria habilita explícitamente.

## Stack

- **Cliente**: Expo (React Native + TypeScript) con Expo Router.
- **Almacenamiento primario**: SQLite local (`expo-sqlite`) — local-first,
  la app funciona sin cuenta ni red.
- **Backend**: Supabase (Postgres + Auth), solo para sincronizar y para la
  vinculación de pareja. Ver `supabase/schema.sql`.
- **IA**: módulo en `lib/ai.ts`, listo para conectar a un endpoint propio
  que hable con la API de Claude (ver nota de seguridad ahí sobre por qué
  no directo desde el cliente).

## Cómo correr el proyecto

```bash
npm install
cp .env.example .env   # completar si vas a usar Supabase / IA
npm start              # abre Expo Dev Tools; elegí Android, iOS o web
```

```bash
npm test                # corre los tests de lib/ (predicción, calendario,
                         # fertilidad, embarazo, reporte de salud)
npx tsc --noEmit         # chequeo de tipos
```

## Configurar Supabase (opcional para el modo local)

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Corré `supabase/schema.sql` en el SQL Editor del proyecto.
3. Copiá la URL y la `anon key` a `.env` (`EXPO_PUBLIC_SUPABASE_URL`,
   `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
4. Habilitá el proveedor **Email** en Authentication → Providers.
5. **Importante**: en Authentication → Email Templates → *Magic Link*,
   agregá `{{ .Token }}` al cuerpo del mail. La plantilla que viene por
   default solo trae el link, y la app pide el código de 6 dígitos: sin
   este cambio el mail llega pero no se puede completar el ingreso.

Si venís de una versión anterior que usaba sesiones anónimas, dejá
habilitado "Anonymous sign-ins" hasta que esas cuentas hayan reclamado su
mail (la app las detecta y ofrece hacerlo sin perder los vínculos).

## Estructura

```
app/                  pantallas (Expo Router)
  index.tsx           fase actual, predicción y accesos del día
  calendar.tsx        calendario mensual + historial de ciclos
  log.tsx             registro diario de síntomas, ánimo y flujo
                        (acepta ?date= para completar días pasados)
  link.tsx            generar/canjear código de vinculación + QR
lib/
  cycle.ts            algoritmo de predicción — funciones puras, con tests
  calendar.ts         armado de la grilla mensual e historial, con tests
  db.ts               almacenamiento local (expo-sqlite)
  supabase.ts         cliente de Supabase
  sync.ts             puente entre lo local y Supabase
  ai.ts               asistente de IA (placeholder hasta conectar backend)
supabase/
  schema.sql           schema + RLS (profiles, cycles, daily_logs,
                        connections, connection_invites, share_settings)
```

## Modelo de datos: vinculación de pareja

`connections` es simétrica y sin roles fijos: cualquiera puede generar un
código de invitación (`connection_invites`) y cualquiera puede canjearlo,
sin ningún campo de género en el schema. Una vez aceptada la conexión, un
trigger crea automáticamente la fila de `share_settings` de cada parte con
todo apagado salvo las fechas de ciclo — cada usuaria decide después, por
conexión, si además comparte síntomas o ánimo.

## Calendario e historial

El calendario distingue siempre entre lo registrado y lo estimado: el
sangrado que la usuaria marcó va relleno, y lo proyectado hacia adelante en
tinte suave. Mostrar las dos cosas iguales haría que una estimación se lea
como un dato, que es justo lo que no queremos en una app donde alguien
puede tomar una decisión sobre eso.

Desde cualquier día pasado se puede completar el registro hacia atrás
(`/log?date=YYYY-MM-DD`) o corregir un inicio de período mal cargado —
borrarlo también lo borra de Supabase, para que la pareja vinculada no
siga viendo el ciclo viejo. Toda la lógica de la grilla vive en
`lib/calendar.ts` como funciones puras, testeadas sin montar la UI.

## Cuenta

La cuenta es **opcional y sirve para una sola cosa**: que el vínculo con
otra persona sobreviva a cambiar de teléfono. Sin cuenta la app funciona
entera — ciclo, registros, calendario, recordatorios y reporte.

Es mail + código de 6 dígitos, sin contraseña. Se usa el código y no el
link mágico porque el link tiene que volver a la app por deep link, y ahí
es donde se rompe (mail abierto en otro dispositivo, navegador que ignora
el scheme, cliente de correo que precarga el link y lo consume).

Quien ya se había vinculado con una sesión anónima **no pierde nada**: la
app le ofrece asociar su mail al mismo usuario (`updateUser` +
`verifyOtp` de tipo `email_change`), así conserva el `user_id` y con él
todas sus conexiones. Ver `lib/auth.ts` (Supabase) y `lib/authRules.ts`
(validación y textos, con tests).

## Recordatorios

Avisos locales de período próximo, de ventana fértil (buscando embarazo) y
de registro diario. Vienen **apagados**, y el modo discreto viene prendido:
la notificación aparece en la pantalla bloqueada, que es un lugar que la
usuaria no controla, así que por default no dice de qué se trata.

`lib/reminders.ts` decide qué avisar (puro, con tests) y
`lib/notifications.ts` lo agenda en el sistema. **Solo funcionan en Android
e iOS**: un navegador con la pestaña cerrada no puede disparar un aviso
local, así que en web la pantalla lo explica en vez de simular que quedó
agendado.

## Qué falta para producción

- Conectar `lib/ai.ts` a un endpoint propio con la API de Claude.
- Publicación en Play Store / App Store — falta configurar EAS Build.

Ver `rumbo.md` para el orden y el detalle.
