import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addCycleStart } from "@/lib/db";
import { pushCycleToCloud } from "@/lib/sync";
import { useCyclePrediction } from "@/lib/useCyclePrediction";
import { usePregnancy } from "@/lib/usePregnancy";
import { getWeekContent } from "@/lib/pregnancyContent";
import { PHASE_NOTES } from "@/lib/phaseNotes";
import { formatDateEs, greetingForHour } from "@/lib/format";
import { colors, radius, space, type } from "@/lib/theme";
import {
  ActionRow,
  Card,
  Eyebrow,
  FadeInView,
  HeroCard,
  PrimaryButton,
  ProgressBar,
  QuietButton,
} from "@/lib/ui";
import {
  BookIcon,
  CalendarPlusIcon,
  DropletIcon,
  LinkPeopleIcon,
  MoonIcon,
  PulseIcon,
  SproutIcon,
  SunIcon,
} from "@/lib/icons";
import { PREGNANCY_LENGTH_DAYS, type Trimester } from "@/lib/pregnancy";
import type { CyclePhase } from "@/lib/cycle";

const PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual: "Menstrual",
  folicular: "Folicular",
  ovulacion: "Ovulación",
  lutea: "Lútea",
};

const PHASE_ICONS: Record<CyclePhase, typeof DropletIcon> = {
  menstrual: DropletIcon,
  folicular: SproutIcon,
  ovulacion: SunIcon,
  lutea: MoonIcon,
};

const TRIMESTER_LABELS: Record<Trimester, string> = {
  primero: "Primer trimestre",
  segundo: "Segundo trimestre",
  tercero: "Tercer trimestre",
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const router = useRouter();
  const cycle = useCyclePrediction();
  const pregnancy = usePregnancy();
  const [saving, setSaving] = useState(false);

  // index.tsx es la pantalla raíz: nunca se desmonta al navegar a otra y
  // volver, así que el useEffect de cada hook no se vuelve a disparar solo.
  useFocusEffect(
    useCallback(() => {
      cycle.reload();
      pregnancy.reload();
    }, [cycle.reload, pregnancy.reload])
  );

  async function markPeriodStartToday() {
    setSaving(true);
    try {
      const start = todayStr();
      await addCycleStart(start);
      await pushCycleToCloud({ startDate: start, periodLength: null });
      await cycle.reload();
    } finally {
      setSaving(false);
    }
  }

  const greeting = greetingForHour(new Date().getHours());

  if (cycle.loading || pregnancy.loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.clay} />
      </View>
    );
  }

  const sharedActions = (startIndex: number) => (
    <>
      <ActionRow
        index={startIndex}
        icon={<PulseIcon size={21} color={colors.clayDeep} />}
        tint="#F0E2DA"
        title="Registrar hoy"
        subtitle="Flujo, síntomas y cómo te sentís"
        onPress={() => router.push("/log")}
      />
      <ActionRow
        index={startIndex + 1}
        icon={<LinkPeopleIcon size={21} color="#4F6E50" />}
        tint="#E1E9DD"
        title="Vincular a alguien"
        subtitle="Pareja, amiga o red de apoyo"
        onPress={() => router.push("/link")}
      />
      <ActionRow
        index={startIndex + 2}
        icon={<BookIcon size={21} color="#6B4C71" />}
        tint="#E8E0EA"
        title="Reporte para el médico"
        subtitle="Resumen en PDF de tus ciclos"
        onPress={() => router.push("/health-report")}
      />
    </>
  );

  if (pregnancy.progress) {
    const { week, dayOfWeek, trimester, dueDate, daysUntilDueDate } = pregnancy.progress;
    const content = getWeekContent(week);
    const elapsed = PREGNANCY_LENGTH_DAYS - Math.max(0, daysUntilDueDate);

    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <HeroCard gradient={colors.gradients.plum}>
            <Eyebrow tone="onDark">{greeting}</Eyebrow>
            <Text style={[type.hero, styles.heroTitle]}>Semana {week}</Text>
            <Text style={[type.body, { color: colors.onDarkSoft }]}>
              {TRIMESTER_LABELS[trimester]}
              {dayOfWeek > 0 ? ` · ${week} semanas y ${dayOfWeek} días` : ""}
            </Text>

            <View style={styles.heroSpacer} />
            <ProgressBar
              ratio={elapsed / PREGNANCY_LENGTH_DAYS}
              label={`${Math.round((elapsed / PREGNANCY_LENGTH_DAYS) * 100)}% del camino`}
            />
          </HeroCard>

          <Card index={1}>
            <Eyebrow>Esta semana</Eyebrow>
            <Text style={[type.section, styles.cardHeading]}>
              Del tamaño de {content.sizeComparison}
            </Text>
            <Text style={[type.body, { color: colors.inkSoft }]}>{content.blurb}</Text>
          </Card>

          <FadeInView index={2}>
            <View style={styles.statRow}>
              <Stat label="Fecha probable" value={formatDateEs(dueDate)} />
              <Stat
                label="Faltan"
                value={daysUntilDueDate >= 0 ? `${daysUntilDueDate} días` : "Ya llegó"}
              />
            </View>
          </FadeInView>

          <FadeInView index={3}>
            <Eyebrow>Ahora</Eyebrow>
          </FadeInView>
          {sharedActions(4)}

          <QuietButton
            label="Editar fecha o salir del modo embarazo"
            onPress={() => router.push("/pregnancy-setup")}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!cycle.hasAnyData || !cycle.prediction) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <HeroCard gradient={colors.gradients.plum}>
            <Eyebrow tone="onDark">{greeting}</Eyebrow>
            <Text style={[type.hero, styles.heroTitle]}>Empecemos</Text>
            <Text style={[type.body, { color: colors.onDarkSoft }]}>
              Con una sola fecha alcanza para arrancar. Todo lo que registres queda
              en este dispositivo.
            </Text>
          </HeroCard>

          <Card index={1}>
            <Eyebrow>Primer paso</Eyebrow>
            <Text style={[type.section, styles.cardHeading]}>
              ¿Cuándo empezó tu último período?
            </Text>
            <Text style={[type.body, { color: colors.inkSoft, marginBottom: space.lg }]}>
              Si fue hoy, tocá el botón. Si fue otro día, podés cargarlo después sin
              perder nada.
            </Text>
            <PrimaryButton
              label={saving ? "Guardando..." : "Mi período empezó hoy"}
              onPress={markPeriodStartToday}
              disabled={saving}
            />
          </Card>

          <QuietButton
            label="Estoy embarazada"
            onPress={() => router.push("/pregnancy-setup")}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { prediction, isEstimated } = cycle;
  const note = PHASE_NOTES[prediction.phase];
  const PhaseIcon = PHASE_ICONS[prediction.phase];
  const cycleLength = prediction.cycleDay + prediction.daysUntilNextPeriod;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <HeroCard gradient={colors.gradients[prediction.phase]}>
          <Eyebrow tone="onDark">{greeting}</Eyebrow>
          <View style={styles.heroTitleRow}>
            <Text style={[type.hero, styles.heroTitle]}>
              {PHASE_LABELS[prediction.phase]}
            </Text>
            <PhaseIcon size={30} color={colors.onDarkSoft} />
          </View>
          <Text style={[type.body, { color: colors.onDarkSoft }]}>
            Día {prediction.cycleDay} del ciclo
          </Text>

          <View style={styles.heroSpacer} />
          <ProgressBar
            ratio={prediction.cycleDay / Math.max(cycleLength, 1)}
            label={`Día ${prediction.cycleDay} de ~${cycleLength}`}
          />
        </HeroCard>

        <Card index={1}>
          <Eyebrow>Lo que está pasando</Eyebrow>
          <Text style={[type.section, styles.cardHeading]}>{note.title}</Text>
          <Text style={[type.body, { color: colors.inkSoft }]}>{note.body}</Text>
          <View style={styles.chipWrap}>
            {note.common.map((item) => (
              <View key={item} style={styles.chip}>
                <Text style={[type.bodySmall, { color: colors.inkSoft }]}>{item}</Text>
              </View>
            ))}
          </View>
        </Card>

        <FadeInView index={2}>
          <View style={styles.statRow}>
            <Stat
              label="Próximo período"
              value={formatDateEs(prediction.nextPeriodDate)}
              sub={`en ${prediction.daysUntilNextPeriod} días`}
            />
            <Stat
              label="Ventana fértil"
              value={formatDateEs(prediction.fertileWindowStart)}
              sub={`al ${formatDateEs(prediction.fertileWindowEnd)}`}
            />
          </View>
        </FadeInView>

        {isEstimated && (
          <FadeInView index={3}>
            <Text style={[type.bodySmall, styles.estimateNote]}>
              Estimado sobre un ciclo de 28 días. Se ajusta solo a medida que
              registrás más períodos.
            </Text>
          </FadeInView>
        )}

        <FadeInView index={4}>
          <Eyebrow>Ahora</Eyebrow>
        </FadeInView>

        <ActionRow
          index={5}
          icon={<CalendarPlusIcon size={21} color={colors.clayDeep} />}
          tint="#F0E2DA"
          title="Mi período empezó hoy"
          subtitle={saving ? "Guardando..." : "Ajusta la predicción al instante"}
          onPress={markPeriodStartToday}
        />
        {sharedActions(6)}

        <QuietButton
          label="Estoy embarazada"
          onPress={() => router.push("/pregnancy-setup")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.stat}>
      <Eyebrow>{label}</Eyebrow>
      <Text style={[type.cardTitle, { color: colors.ink, marginTop: space.sm }]}>{value}</Text>
      {sub && <Text style={[type.bodySmall, { color: colors.inkFaint }]}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  heroTitle: { color: colors.onDark, marginTop: space.sm },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  heroSpacer: { height: space.xl },
  cardHeading: { color: colors.ink, marginTop: space.xs, marginBottom: space.sm },
  statRow: { flexDirection: "row", gap: space.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: space.lg,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.lg },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: space.md,
  },
  estimateNote: { color: colors.inkFaint, textAlign: "center", paddingHorizontal: space.lg },
});
