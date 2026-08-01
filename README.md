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
4. La vinculación de pareja usa `supabase.auth.signInAnonymously()` para no
   pedir registro completo en el MVP — hay que habilitar "Anonymous
   sign-ins" en Authentication → Providers del proyecto.

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

## Qué falta para producción

- Pantalla de registro/login "de verdad" (hoy la vinculación usa sesión
  anónima de Supabase).
- Conectar `lib/ai.ts` a un endpoint propio con la API de Claude.
- Notificaciones (recordatorio de período próximo, de tomar anticonceptivo).
- Publicación en Play Store / App Store — falta configurar EAS Build.
