# Checkpoint

Bitácora de avance por sesión: qué se hizo, en qué rama, y en qué estado
quedó. Pensada para retomar el trabajo sin tener que releer todo el
`git log`. `rumbo.md` tiene la visión y los principios; esto es el
registro de progreso concreto.

Convención: entrada nueva arriba, fecha + resumen de una línea, después
el detalle. Se agrega una entrada por sesión de trabajo con cambios
reales, no por cada commit individual.

---

## 2026-08-07 — Estadísticas, registro de flujo vaginal

**Rama:** `claude/app-sintunia-hufnmt` · commiteado y pusheado, sin PR
abierto (no se pidió explícitamente).

- Pantalla nueva `/insights` ("Estadísticas"): promedio y rango de
  duración de ciclo, gráfico de barras propio (sin librería externa) con
  la tendencia de los últimos 12 ciclos, síntomas/ánimo/flujo vaginal más
  frecuentes, y % de días registrados desde el primer ciclo cargado.
  Lógica pura en `lib/insights.ts`, con tests.
- Registro diario (`app/log.tsx`) suma una tarjeta "Flujo vaginal": chips
  de selección múltiple para marcar señales distintas a lo habitual
  (color amarillo/verde/gris/rosado/marrón, más espeso o grumoso, muy
  líquido o espumoso, olor fuerte, olor a pescado, picazón o ardor), con
  enlace directo al artículo nuevo.
- Artículo `flujo-vaginal` en la biblioteca: qué suelen indicar el color,
  la textura y el olor del flujo (candidiasis, vaginosis bacteriana,
  tricomoniasis, manchado normal de ovulación, irritación cervical,
  etc.), con señales de alarma y sin afirmar diagnóstico — siguiendo las
  reglas ya establecidas en `lib/library.ts`.
- Migración de esquema para `discharge_signs`: `ALTER TABLE` con
  try/catch en SQLite (no existe `ADD COLUMN IF NOT EXISTS`), `add column
  if not exists` en `supabase/schema.sql`, default a `[]` al leer JSON
  viejo en `db.web.ts`. Documentado como patrón a seguir en `CLAUDE.md`.
- Decisión de privacidad tomada en esta sesión: `dischargeSigns`
  sincroniza a Supabase como backup propio de la usuaria, pero
  `fetchPartnerDailyLogs` no lo pide — no se expone a la pareja
  vinculada aunque comparta síntomas/ánimo. Ver principio 1 en
  `rumbo.md`.
- Probado end-to-end de verdad (no solo tests): `expo start --web
  --offline` (el `--offline` hace falta en sandboxes con red
  restringida, si no el arranque se cuelga validando versiones contra la
  API de Expo) + Chromium headless vía Playwright. Recorrido completo
  registro → artículo → guardar → estadísticas, sin errores de consola.
- `npx jest` (61 tests) y `npx tsc --noEmit` en verde antes de cada push.
- Se crearon `CLAUDE.md`, `rumbo.md` y este archivo — no existían antes
  de esta sesión.

## Antes de esta sesión (del historial de git)

- Scaffold inicial: app de ciclo menstrual con vinculación inclusiva.
- Vinculación de pareja: ver el ciclo y los registros compartidos de una
  conexión aceptada.
- Modo embarazo: semana gestacional + tarjeta de progreso.
- Reporte de salud exportable en PDF para consulta médica.
- Rediseño completo de interfaz: sistema de diseño propio, tono sin
  juicio (ver principio 3 en `rumbo.md`).
- Biblioteca de contenidos + guía de respiración.
- Modo "buscando embarazo" con la ventana fértil al frente.
- Artículo de SOP actualizado al nuevo nombre SOMP/PMOS (consenso
  publicado en *The Lancet*, mayo 2026).

## Próximo punto de partida sugerido

Ver "Qué falta / hacia dónde sigue" en `rumbo.md` — login real,
conectar `lib/ai.ts`, notificaciones, o publicación en stores, según lo
que se priorice.
