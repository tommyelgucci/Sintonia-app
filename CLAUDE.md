# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

El producto, la UI, los comentarios del código y los mensajes de commit
están en español rioplatense. Escribí en ese registro — no traduzcas el
código existente ni mezcles idiomas dentro de un archivo.

## Qué es Sintonía

App de seguimiento de ciclo menstrual, salud hormonal y planificación,
hecha con Expo (React Native + TypeScript) sobre los tres targets: iOS,
Android y web. Dos principios que atraviesan todo el código y que conviene
respetar antes de agregar cualquier cosa:

1. **Local-first.** SQLite en el dispositivo es la fuente de verdad. La app
   tiene que funcionar entera sin cuenta y sin red. Supabase es una copia
   opcional, nunca el origen del dato.
2. **Sin asumir configuración de género ni juzgar.** El schema no tiene
   ningún campo de género y `connections` es simétrica, sin roles fijos.
   El copy no felicita ni reta a nadie por lo que registra.

## Comandos

```bash
npm start                # Expo Dev Tools; elegir Android, iOS o web
npm run web              # directo a web (el target más rápido para probar)
npm test                 # todos los tests (jest + ts-jest, sin RN)
npx jest lib/cycle       # un solo archivo de tests
npx jest -t "ovulación"  # un solo caso por nombre
npx tsc --noEmit         # chequeo de tipos
```

No hay linter configurado. `npx expo start` reescribe `tsconfig.json` y
borra `expo-env.d.ts` como efecto secundario: revertí esos dos archivos
antes de commitear si aparecen en el diff.

Para verificar un cambio de UI de verdad, levantá el target web y manejalo
con Playwright (Chromium ya está en `/opt/pw-browsers/chromium`; pasale
`executablePath`). Se puede sembrar estado escribiendo `sintonia_cycles` y
`sintonia_daily_logs` en `localStorage` antes de recargar.

## Arquitectura

### La regla que ordena todo: lógica pura en `lib/`, pantallas tontas en `app/`

Cada regla de negocio vive en un módulo de `lib/` como función pura sobre
strings `'YYYY-MM-DD'`, sin tocar la base ni el reloj, y con tests. Las
pantallas solo leen datos, llaman a esas funciones y dibujan. Por eso los
tests corren en Node sin montar React Native. Al agregar una regla nueva
(una fase, una ventana, un umbral), va en `lib/` con su test — no adentro
del componente.

Módulos de dominio: `cycle.ts` (predicción), `calendar.ts` (grilla mensual
e historial), `fertility.ts` (ventana fértil cuando busca embarazo),
`pregnancy.ts` (semana gestacional), `healthReport.ts` (resumen médico),
más los de contenido editorial (`library.ts`, `phaseNotes.ts`,
`pregnancyContent.ts`).

### Fechas: siempre string, siempre UTC

Todo el dominio usa `'YYYY-MM-DD'` y las helpers `addDays` / `diffDays` de
`lib/cycle.ts`, que parsean a medianoche UTC. Nunca compares contra
`Date.now()` ni uses `toLocaleDateString` (depende del locale del
dispositivo: el teléfono en inglés rompería la pantalla en español —
`lib/format.ts` formatea a mano por eso). `today` se pasa como parámetro a
las funciones puras en vez de leerse adentro, que es lo que las hace
testeables.

### Almacenamiento: `db.ts` y `db.web.ts`

`lib/db.ts` usa expo-sqlite; `lib/db.web.ts` es el mismo API sobre
AsyncStorage porque expo-sqlite ~15 no tiene backend de web. Metro resuelve
`.web.ts` automáticamente. **Toda función que agregues a uno tiene que
existir en el otro con la misma firma**, o la app compila y falla recién en
runtime en un solo target.

### Sincronización: `lib/sync.ts`, siempre después de escribir local

Las funciones `push*ToCloud` / `remove*FromCloud` no hacen nada si no hay
sesión de Supabase, así que se pueden llamar siempre. El patrón es escribir
local primero y después empujar, nunca al revés. Si agregás una operación
de borrado local que ya se sincronizó, agregá también su contraparte en la
nube: si no, una conexión vinculada sigue viendo el dato viejo.

`supabase/schema.sql` tiene el modelo con RLS. El filtrado de privacidad
pasa en el server: `share_settings` decide, por conexión, qué ve la otra
persona (fechas de ciclo sí por default; síntomas, ánimo y notas solo si se
habilitan). El cliente no filtra nada — consulta y recibe lo que RLS deje.
La vinculación usa `signInAnonymously()` en el MVP.

### Navegación y estado

Expo Router con un stack plano en `app/_layout.tsx`; toda pantalla nueva se
registra ahí para que tenga título. `app/index.tsx` es la raíz y **no se
desmonta** al volver de otra pantalla, así que recarga con `useFocusEffect`
en vez de `useEffect`. Los hooks (`useCyclePrediction`, `usePregnancy`,
`useIntention`) exponen `reload()` para llamar después de escribir.

La home tiene tres modos según `useIntention` (`tracking` / `conceiving` /
`pregnant`, guardado en `preferences`) y el embarazo activo: cada uno
cambia la tarjeta héroe, no la pantalla entera.

Los parámetros de ruta se sanean antes de usarse (`normalizeDateParam` en
`lib/calendar.ts`): en web la URL es editable a mano.

### Diseño

`lib/theme.ts` es el sistema (paleta cálida desaturada, Fraunces para lo
que se lee y Karla para lo que se opera) y `lib/ui.tsx` los primitivos
(`HeroCard`, `Card`, `ActionRow`, `Eyebrow`, `FadeInView`…). Usá esos, no
estilos sueltos. Nada de emoji en la UI: los iconos son SVG propios en
`lib/icons.tsx` porque el emoji cambia de forma entre plataformas.

Las pantallas encadenan `index` en los bloques para el fade-in escalonado;
si insertás una fila en el medio, corregí los índices siguientes.

Regla de contenido: **lo registrado y lo estimado nunca se ven igual**. En
el calendario el sangrado marcado va relleno y lo proyectado en tinte
suave. Alguien puede tomar una decisión real sobre eso.

### Los tres targets rompen distinto

Ya hay tres lugares donde web y nativo divergen, y conviene sospechar
siempre que se toca una API de plataforma:

- `Alert.alert` es un no-op en react-native-web → usar `lib/notify.ts`.
- `expo-print` en web ignora el HTML y solo imprime la página actual → ver
  `lib/healthReportExport.ts`.
- `router.back()` no hace nada si la pantalla es la primera del stack (pasa
  al entrar por URL directa o por el QR de vinculación) → usar
  `goBackOrHome()` de `lib/nav.ts`.
- Los recordatorios locales no existen en web (`lib/notifications.web.ts`
  es no-op y `REMINDERS_SUPPORTED` es false; la pantalla lo explica en vez
  de ofrecer controles muertos).
- El `Switch` de react-native-web ignora `thumbColor` cuando está prendido:
  usa su propio `activeThumbColor`, que por default es verde azulado.

### Recordatorios

`lib/reminders.ts` decide **qué** avisar (puro, testeado) y
`lib/notifications.ts` lo agenda en el SO. Esa capa es **el único lugar de
la app que usa hora local**: el dominio es UTC, pero el aviso tiene que
sonar a las 10 de la persona que lo recibe.

El plan se recalcula entero y se reagenda con `rescheduleReminders()` cada
vez que cambia algo que mueve las fechas (registrar o borrar un inicio,
cambiar de objetivo, entrar o salir de embarazo). Si agregás otra escritura
que corra la predicción, llamala también: un aviso viejo que sobrevive
llega el día equivocado, que es peor que no avisar.

El default es **modo discreto** prendido: la notificación aparece en la
pantalla bloqueada, que es un lugar que la usuaria no controla.

### IA

`lib/ai.ts` es un placeholder: arma el contexto y le pega a
`EXPO_PUBLIC_AI_ENDPOINT`, un backend propio a escribir. **No** poner una
API key de Anthropic en el cliente: el bundle de una app publicada es
descompilable.

## Rumbo

`rumbo.md` tiene qué está hecho, qué falta y en qué orden conviene. Leelo
antes de proponer trabajo nuevo, y actualizalo cuando cierres algo.
