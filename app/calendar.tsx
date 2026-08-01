import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  addCycleStart,
  listCycles,
  listDailyLogs,
  removeCycleStart,
} from "@/lib/db";
import { pushCycleToCloud, removeCycleFromCloud } from "@/lib/sync";
import {
  buildCycleHistory,
  buildMonth,
  cycleDayFor,
  monthLabel,
  shiftMonth,
  WEEKDAYS,
  type CalendarDay,
  type DayMarker,
} from "@/lib/calendar";
import { confirmDestructive } from "@/lib/notify";
import { formatDateEs } from "@/lib/format";
import { colors, radius, space, type } from "@/lib/theme";
import { Card, Eyebrow, FadeInView, PrimaryButton, QuietButton } from "@/lib/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "@/lib/icons";
import type { CycleRecord, DailyLog } from "@/lib/types";

/**
 * Cómo se ve cada marca. El registrado va relleno y el estimado en tinte
 * suave: la diferencia entre "esto pasó" y "esto probablemente pase" tiene
 * que leerse de un vistazo, sin ir a buscar la referencia.
 */
const MARKER_STYLES: Record<
  Exclude<DayMarker, null>,
  { background: string; text: string; label: string }
> = {
  period: { background: colors.menstrual, text: colors.onDark, label: "período registrado" },
  predictedPeriod: { background: "#F1DEDD", text: colors.menstrual, label: "período estimado" },
  ovulation: { background: colors.ovulacion, text: colors.onDark, label: "ovulación estimada" },
  fertile: { background: "#F5E7D2", text: "#7A5620", label: "ventana fértil estimada" },
};

const LEGEND: Exclude<DayMarker, null>[] = [
  "period",
  "predictedPeriod",
  "fertile",
  "ovulation",
];

const FLOW_LABELS: Record<DailyLog["flow"], string> = {
  none: "Sin sangrado",
  light: "Flujo leve",
  medium: "Flujo medio",
  heavy: "Flujo abundante",
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CalendarScreen() {
  const router = useRouter();
  const today = todayStr();
  const [cursor, setCursor] = useState(() => ({
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)),
  }));
  const [selected, setSelected] = useState(today);
  const [cycles, setCycles] = useState<CycleRecord[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const [nextCycles, nextLogs] = await Promise.all([listCycles(), listDailyLogs()]);
    setCycles(nextCycles);
    setLogs(nextLogs);
    setLoading(false);
  }, []);

  // Se vuelve acá después de registrar un día en /log: sin esto el
  // calendario seguiría mostrando el estado con el que se fue.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const pastCycles = useMemo(
    () => cycles.map((c) => ({ startDate: c.startDate, periodLength: c.periodLength ?? undefined })),
    [cycles]
  );

  const days = useMemo(
    () => buildMonth({ year: cursor.year, month: cursor.month, cycles: pastCycles, logs, today }),
    [cursor.year, cursor.month, pastCycles, logs, today]
  );

  const history = useMemo(() => buildCycleHistory(pastCycles, logs), [pastCycles, logs]);

  const selectedDay = days.find((d) => d.date === selected) ?? null;
  const selectedLog = logs.find((l) => l.logDate === selected) ?? null;
  const selectedCycleDay = cycleDayFor(selected, pastCycles);
  const isCurrentMonth =
    cursor.year === Number(today.slice(0, 4)) && cursor.month === Number(today.slice(5, 7));

  function goToMonth(delta: number) {
    setCursor((c) => shiftMonth(c.year, c.month, delta));
  }

  /**
   * Tocar un día de relleno mueve el calendario a su mes. Quedarse en el
   * mes actual con un día de otro seleccionado deja la tarjeta de abajo
   * hablando de una fecha que arriba se ve gris y a medio camino.
   */
  function selectDay(day: CalendarDay) {
    setSelected(day.date);
    if (!day.inMonth) {
      setCursor({
        year: Number(day.date.slice(0, 4)),
        month: Number(day.date.slice(5, 7)),
      });
    }
  }

  function goToToday() {
    setCursor({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) });
    setSelected(today);
  }

  async function toggleCycleStart() {
    if (!selectedDay || selectedDay.isFuture) return;
    setSaving(true);
    try {
      if (selectedDay.isCycleStart) {
        await removeCycleStart(selected);
        await removeCycleFromCloud(selected);
      } else {
        await addCycleStart(selected);
        await pushCycleToCloud({ startDate: selected, periodLength: null });
      }
      await reload();
    } finally {
      setSaving(false);
    }
  }

  function confirmToggleCycleStart() {
    if (!selectedDay) return;
    if (!selectedDay.isCycleStart) {
      toggleCycleStart();
      return;
    }
    // Borrar un inicio recalcula todas las predicciones hacia atrás y hacia
    // adelante; conviene preguntar antes de que parezca que se movió solo.
    confirmDestructive(
      "Quitar este inicio de período",
      `Se borra el ${formatDateEs(selected)} como inicio de ciclo y se recalculan las predicciones. Los registros de ese día no se tocan.`,
      toggleCycleStart,
      "Quitar"
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.clay} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <FadeInView>
        <View style={styles.monthNav}>
          <Pressable
            onPress={() => goToMonth(-1)}
            accessibilityRole="button"
            accessibilityLabel="Mes anterior"
            style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          >
            <ChevronLeftIcon size={18} color={colors.ink} />
          </Pressable>
          <Text style={[type.title, styles.monthTitle]}>
            {monthLabel(cursor.year, cursor.month)}
          </Text>
          <Pressable
            onPress={() => goToMonth(1)}
            accessibilityRole="button"
            accessibilityLabel="Mes siguiente"
            style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          >
            <ChevronRightIcon size={18} color={colors.ink} />
          </Pressable>
        </View>
      </FadeInView>

      <Card index={1} style={styles.gridCard}>
        <View style={styles.weekRow}>
          {WEEKDAYS.map((label, i) => (
            <View key={i} style={styles.cell}>
              <Text style={[type.eyebrow, { color: colors.inkFaint, textAlign: "center" }]}>
                {label}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.grid}>
          {days.map((day) => (
            <DayCell
              key={day.date}
              day={day}
              selected={day.date === selected}
              onPress={() => selectDay(day)}
            />
          ))}
        </View>
      </Card>

      <FadeInView index={2}>
        <View style={styles.legend}>
          {LEGEND.map((marker) => (
            <View key={marker} style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: MARKER_STYLES[marker].background }]}
              />
              <Text style={[type.bodySmall, { color: colors.inkSoft }]}>
                {MARKER_STYLES[marker].label}
              </Text>
            </View>
          ))}
        </View>
      </FadeInView>

      {selectedDay && (
        <Card index={3}>
          <Eyebrow>{selectedDay.isToday ? "Hoy" : "Día seleccionado"}</Eyebrow>
          <Text style={[type.section, styles.cardHeading]}>
            {formatDateEs(selected, true)}
          </Text>
          <Text style={[type.bodySmall, { color: colors.inkSoft }]}>
            {selectedCycleDay !== null ? `Día ${selectedCycleDay} del ciclo` : "Antes de tu primer registro"}
            {selectedDay.marker ? ` · ${MARKER_STYLES[selectedDay.marker].label}` : ""}
          </Text>

          {selectedLog && (
            <View style={styles.logSummary}>
              <View style={styles.chipWrap}>
                <View style={styles.chip}>
                  <Text style={[type.bodySmall, { color: colors.inkSoft }]}>
                    {FLOW_LABELS[selectedLog.flow]}
                  </Text>
                </View>
                {[...selectedLog.symptoms, ...selectedLog.mood].map((item) => (
                  <View key={item} style={styles.chip}>
                    <Text style={[type.bodySmall, { color: colors.inkSoft }]}>{item}</Text>
                  </View>
                ))}
              </View>
              {selectedLog.notes && (
                <Text style={[type.body, { color: colors.inkSoft, marginTop: space.md }]}>
                  {selectedLog.notes}
                </Text>
              )}
            </View>
          )}

          <View style={styles.actions}>
            {selectedDay.isFuture ? (
              <Text style={[type.bodySmall, { color: colors.inkFaint }]}>
                Todavía no pasó. Cuando llegue el día vas a poder registrarlo acá mismo.
              </Text>
            ) : (
              <>
                <PrimaryButton
                  label={selectedLog ? "Editar el registro de este día" : "Registrar este día"}
                  onPress={() => router.push(`/log?date=${selected}`)}
                />
                <QuietButton
                  label={
                    saving
                      ? "Guardando..."
                      : selectedDay.isCycleStart
                        ? "Quitar inicio de período"
                        : "Marcar inicio de período"
                  }
                  onPress={confirmToggleCycleStart}
                />
              </>
            )}
          </View>
        </Card>
      )}

      {!isCurrentMonth && <QuietButton label="Volver a hoy" onPress={goToToday} />}

      <FadeInView index={4}>
        <Eyebrow>Historial</Eyebrow>
      </FadeInView>

      {history.length === 0 ? (
        <FadeInView index={5}>
          <Text style={[type.bodySmall, { color: colors.inkFaint }]}>
            Todavía no registraste ningún inicio de período. Tocá un día del calendario
            y marcalo — con uno solo la app ya empieza a predecir.
          </Text>
        </FadeInView>
      ) : (
        history.slice(0, 12).map((entry, i) => (
          <FadeInView key={entry.startDate} index={5 + i}>
            <Pressable
              onPress={() => {
                setSelected(entry.startDate);
                setCursor({
                  year: Number(entry.startDate.slice(0, 4)),
                  month: Number(entry.startDate.slice(5, 7)),
                });
              }}
              style={({ pressed }) => [styles.historyRow, pressed && styles.pressed]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[type.cardTitle, { color: colors.ink }]}>
                  {formatDateEs(entry.startDate, true)}
                </Text>
                <Text style={[type.bodySmall, { color: colors.inkSoft }]}>
                  {entry.cycleLength !== null
                    ? `Ciclo de ${entry.cycleLength} días`
                    : "Ciclo en curso"}
                  {entry.periodLength !== null
                    ? ` · ${entry.periodLength} ${entry.periodLength === 1 ? "día" : "días"} de sangrado`
                    : ""}
                </Text>
              </View>
              <ChevronRightIcon size={16} color={colors.inkFaint} />
            </Pressable>
          </FadeInView>
        ))
      )}
    </ScrollView>
  );
}

function DayCell({
  day,
  selected,
  onPress,
}: {
  day: CalendarDay;
  selected: boolean;
  onPress: () => void;
}) {
  const marker = day.marker ? MARKER_STYLES[day.marker] : null;
  const textColor = !day.inMonth
    ? colors.inkFaint
    : marker
      ? marker.text
      : colors.ink;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={[
        formatDateEs(day.date, true),
        marker?.label,
        day.isCycleStart ? "inicio de período" : null,
        day.hasLog ? "con registro" : null,
      ]
        .filter(Boolean)
        .join(", ")}
      style={styles.cell}
    >
      <View
        style={[
          styles.dayCircle,
          marker && { backgroundColor: marker.background },
          day.isToday && styles.dayToday,
          selected && styles.daySelected,
          !day.inMonth && styles.dayOutside,
        ]}
      >
        <Text
          style={[
            type.label,
            { color: textColor },
            day.isCycleStart && { fontFamily: "Karla_700Bold" },
          ]}
        >
          {day.dayOfMonth}
        </Text>
      </View>
      {/* El punto marca que ese día tiene un registro guardado; queda fuera
          del círculo para no competir con el color de la fase. */}
      <View style={[styles.logDot, day.hasLog && { backgroundColor: colors.clay }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: space.lg,
    gap: space.md,
    paddingBottom: space.xxl,
    backgroundColor: colors.canvas,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthTitle: { color: colors.ink, textAlign: "center", flex: 1 },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  gridCard: { paddingHorizontal: space.sm },
  weekRow: { flexDirection: "row", marginBottom: space.sm },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  // Siete columnas exactas: el porcentaje evita que la última quede corta en
  // pantallas cuyo ancho no divide en 7.
  cell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 3 },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  dayToday: { borderColor: colors.inkFaint },
  daySelected: { borderColor: colors.clay },
  dayOutside: { opacity: 0.45 },
  logDot: { width: 5, height: 5, borderRadius: radius.pill, marginTop: 3, backgroundColor: "transparent" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: space.md, paddingHorizontal: space.xs },
  legendItem: { flexDirection: "row", alignItems: "center", gap: space.sm },
  legendDot: { width: 12, height: 12, borderRadius: radius.pill },
  cardHeading: { color: colors.ink, marginTop: space.xs, marginBottom: space.xs },
  logSummary: { marginTop: space.md },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: space.md,
  },
  actions: { marginTop: space.lg, gap: space.sm },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.lg,
  },
  pressed: { opacity: 0.82 },
});
