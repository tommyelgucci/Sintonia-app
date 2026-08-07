import { useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useCyclePrediction } from "@/lib/useCyclePrediction";
import { useIntention } from "@/lib/useIntention";
import { useReminders } from "@/lib/useReminders";
import { ensureNotificationPermission, REMINDERS_SUPPORTED } from "@/lib/notifications";
import {
  buildReminderPlan,
  clampDaysBefore,
  formatHour,
  MAX_DAYS_BEFORE,
  type ReminderSettings,
} from "@/lib/reminders";
import { formatDateEs } from "@/lib/format";
import { colors, radius, space, type } from "@/lib/theme";
import { Card, Eyebrow, FadeInView, PrimaryButton } from "@/lib/ui";

// Horas ofrecidas en vez de un selector libre: alcanzan para cualquier
// rutina y evitan el picker nativo, que se ve distinto en cada plataforma.
const HOUR_OPTIONS = [8, 10, 12, 15, 18, 21];
const DAYS_BEFORE_OPTIONS = [1, 2, 3, 5, 7];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function RemindersScreen() {
  const { settings, granted, setGranted, save } = useReminders();
  const cycle = useCyclePrediction();
  const { intention } = useIntention();
  const [asking, setAsking] = useState(false);

  if (!settings || cycle.loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.clay} />
      </View>
    );
  }

  function update(patch: Partial<ReminderSettings>) {
    if (!settings) return;
    save({ ...settings, ...patch });
  }

  async function askPermission() {
    setAsking(true);
    try {
      const ok = await ensureNotificationPermission();
      setGranted(ok);
      // Prender el primer recordatorio en el mismo gesto: quien acaba de
      // dar permiso lo dio para algo, y dejarlo con todo apagado obliga a
      // un segundo toque que no aporta nada.
      if (ok && settings && !settings.periodSoon) update({ periodSoon: true });
    } finally {
      setAsking(false);
    }
  }

  const plan = buildReminderPlan({
    settings,
    prediction: cycle.prediction,
    intention,
    today: todayStr(),
  });
  const nextDated = plan.filter((r) => r.date).sort((a, b) => a.date!.localeCompare(b.date!))[0];
  const hasDaily = plan.some((r) => r.repeatsDaily);

  if (!REMINDERS_SUPPORTED) {
    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <Eyebrow>Recordatorios</Eyebrow>
          <Text style={[type.title, styles.pageTitle]}>Solo en el teléfono</Text>
        </FadeInView>
        <Card index={1}>
          <Text style={[type.body, { color: colors.inkSoft }]}>
            El navegador no puede avisarte con la pestaña cerrada, así que los
            recordatorios funcionan únicamente en la app de Android o iOS.
            Preferimos decírtelo y no dejarte esperando un aviso que no iba a
            llegar.
          </Text>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <FadeInView>
        <Eyebrow>Recordatorios</Eyebrow>
        <Text style={[type.title, styles.pageTitle]}>Que te avise, sin molestar</Text>
        <Text style={[type.bodySmall, { color: colors.inkSoft }]}>
          Todo esto viene apagado. Prendé solo lo que te sirva y apagalo cuando
          quieras.
        </Text>
      </FadeInView>

      {!granted ? (
        <Card index={1}>
          <Eyebrow>Primero</Eyebrow>
          <Text style={[type.section, styles.cardHeading]}>
            Hace falta tu permiso
          </Text>
          <Text style={[type.body, { color: colors.inkSoft, marginBottom: space.lg }]}>
            Los avisos los arma tu teléfono con lo que ya está guardado acá
            adentro. No se manda nada a ningún servidor para que lleguen.
          </Text>
          <PrimaryButton
            label={asking ? "Esperando..." : "Permitir notificaciones"}
            onPress={askPermission}
            disabled={asking}
          />
          <Text style={[type.bodySmall, { color: colors.inkFaint, marginTop: space.md }]}>
            Si ya lo rechazaste antes, hay que habilitarlo desde los ajustes del
            teléfono: el sistema no vuelve a preguntar.
          </Text>
        </Card>
      ) : (
        <>
          <Card index={1}>
            <Eyebrow>Ciclo</Eyebrow>
            <ToggleRow
              title="Antes del período"
              subtitle="Un aviso los días previos a la fecha estimada, y otro ese día"
              value={settings.periodSoon}
              onValueChange={(periodSoon) => update({ periodSoon })}
            />
            {settings.periodSoon && (
              <View style={styles.subSetting}>
                <Text style={[type.bodySmall, { color: colors.inkSoft }]}>
                  Avisar con esta anticipación:
                </Text>
                <View style={styles.chipWrap}>
                  {DAYS_BEFORE_OPTIONS.map((days) => (
                    <Chip
                      key={days}
                      label={days === 1 ? "1 día" : `${days} días`}
                      selected={clampDaysBefore(settings.daysBefore) === days}
                      onPress={() => update({ daysBefore: Math.min(days, MAX_DAYS_BEFORE) })}
                    />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.divider} />

            <ToggleRow
              title="Ventana fértil"
              subtitle={
                intention === "conceiving"
                  ? "Un aviso el día que empieza"
                  : "Se activa cuando ponés la app en modo buscando embarazo"
              }
              value={settings.fertileWindow}
              disabled={intention !== "conceiving"}
              onValueChange={(fertileWindow) => update({ fertileWindow })}
            />
          </Card>

          <Card index={2}>
            <Eyebrow>Registro</Eyebrow>
            <ToggleRow
              title="Recordarme registrar"
              subtitle="Una vez por día. Sin rachas ni insistencia si no registrás"
              value={settings.dailyLog}
              onValueChange={(dailyLog) => update({ dailyLog })}
            />
            <View style={styles.subSetting}>
              <Text style={[type.bodySmall, { color: colors.inkSoft }]}>
                Los avisos llegan a las:
              </Text>
              <View style={styles.chipWrap}>
                {HOUR_OPTIONS.map((hour) => (
                  <Chip
                    key={hour}
                    label={formatHour(hour)}
                    selected={settings.hour === hour}
                    onPress={() => update({ hour })}
                  />
                ))}
              </View>
            </View>
          </Card>

          <Card index={3}>
            <Eyebrow>Privacidad</Eyebrow>
            <ToggleRow
              title="Modo discreto"
              subtitle="El aviso no dice de qué se trata: el contenido se ve al abrir la app"
              value={settings.discreet}
              onValueChange={(discreet) => update({ discreet })}
            />
            <Text style={[type.bodySmall, { color: colors.inkFaint, marginTop: space.md }]}>
              {settings.discreet
                ? 'En la pantalla bloqueada se lee solo "Sintonía".'
                : "En la pantalla bloqueada se va a leer de qué se trata el aviso. Lo puede ver cualquiera que mire tu teléfono."}
            </Text>
          </Card>

          <Card index={4}>
            <Eyebrow>Lo que queda agendado</Eyebrow>
            {plan.length === 0 ? (
              <Text style={[type.body, { color: colors.inkSoft, marginTop: space.sm }]}>
                Nada por ahora.
                {!cycle.prediction
                  ? " Registrá un inicio de período y la app ya puede calcular cuándo avisarte."
                  : ""}
              </Text>
            ) : (
              <View style={{ marginTop: space.sm, gap: space.xs }}>
                {nextDated && (
                  <Text style={[type.body, { color: colors.inkSoft }]}>
                    Próximo aviso: {formatDateEs(nextDated.date!)} a las{" "}
                    {formatHour(nextDated.hour)}.
                  </Text>
                )}
                {hasDaily && (
                  <Text style={[type.body, { color: colors.inkSoft }]}>
                    Recordatorio de registro todos los días a las {formatHour(settings.hour)}.
                  </Text>
                )}
                <Text style={[type.bodySmall, { color: colors.inkFaint, marginTop: space.sm }]}>
                  Las fechas se recalculan solas cada vez que registrás algo nuevo.
                </Text>
              </View>
            )}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  // react-native-web no usa `thumbColor` cuando el switch está prendido:
  // tiene su propio `activeThumbColor`, que por default es un verde azulado
  // que no existe en la paleta. La prop no existe en el Switch nativo, así
  // que se agrega solo en web.
  const webThumb = Platform.OS === "web" ? ({ activeThumbColor: colors.surface } as object) : null;

  return (
    <View style={[styles.toggleRow, disabled && { opacity: 0.5 }]}>
      <View style={styles.toggleText}>
        <Text style={[type.cardTitle, { color: colors.ink }]}>{title}</Text>
        {subtitle && (
          <Text style={[type.bodySmall, { color: colors.inkSoft }]}>{subtitle}</Text>
        )}
      </View>
      <Switch
        {...webThumb}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.line, true: colors.clay }}
        // Explícito en los tres targets: el default de react-native-web es
        // un verde azulado que no existe en la paleta.
        thumbColor={colors.surface}
        ios_backgroundColor={colors.line}
      />
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      <Text
        style={[
          type.bodySmall,
          { color: selected ? colors.onDark : colors.inkSoft },
          selected && { fontFamily: "Karla_500Medium" },
        ]}
      >
        {label}
      </Text>
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
  pageTitle: { color: colors.ink, marginTop: space.xs, marginBottom: space.xs },
  cardHeading: { color: colors.ink, marginTop: space.xs, marginBottom: space.sm },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    marginTop: space.md,
  },
  toggleText: { flex: 1, gap: 2 },
  subSetting: { marginTop: space.lg },
  divider: { height: 1, backgroundColor: colors.line, marginTop: space.lg },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: space.lg,
  },
  chipSelected: { backgroundColor: colors.clay, borderColor: colors.clay },
  pressed: { opacity: 0.82 },
});
