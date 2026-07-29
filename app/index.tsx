import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addCycleStart } from "@/lib/db";
import { pushCycleToCloud } from "@/lib/sync";
import { useCyclePrediction } from "@/lib/useCyclePrediction";
import { usePregnancy } from "@/lib/usePregnancy";
import { useIntention } from "@/lib/useIntention";
import { getFertilityInfo, FERTILITY_COPY } from "@/lib/fertility";
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
  ChevronRightIcon,
  DropletIcon,
  LinkPeopleIcon,
  MoonIcon,
  PulseIcon,
  ShieldIcon,
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

/**
 * Qué leer según en qué fase está. Se ofrece el contenido en el momento
 * en que probablemente haga falta, en vez de esperar a que lo busque en
 * la biblioteca — que es cuando ya está con el síntoma encima.
 */
const PHASE_SUGGESTION: Record<CyclePhase, { articleId: string; hook: string } | null> = {
  menstrual: {
    articleId: "dolor-bajo-vientre",
    hook: "Si tenés cólicos, qué alivia de verdad y qué señales no conviene esperar.",
  },
  folicular: null,
  ovulacion: null,
  lutea: {
    articleId: "ansiedad-premenstrual",
    hook: "Por qué la ansiedad sube estos días, y qué ayuda cuando ya está alta.",
  },
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HomeScreen() {
  const router = useRouter();
  const cycle = useCyclePrediction();
  const pregnancy = usePregnancy();
  const intentionState = useIntention();
  const [saving, setSaving] = useState(false);

  // index.tsx es la pantalla raíz: nunca se desmonta al navegar a otra y
  // volver, así que el useEffect de cada hook no se vuelve a disparar solo.
  useFocusEffect(
    useCallback(() => {
      cycle.reload();
      pregnancy.reload();
      intentionState.reload();
    }, [cycle.reload, pregnancy.reload, intentionState.reload])
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

  if (cycle.loading || pregnancy.loading || intentionState.loading) {
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
        title="Aprender"
        subtitle="Dolor, anticonceptivos, SOP y más"
        onPress={() => router.push("/library")}
      />
      <ActionRow
        index={startIndex + 3}
        icon={<ShieldIcon size={21} color="#9C6B2C" />}
        tint="#F5E7D2"
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
            label="Editar fecha o cambiar objetivo"
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
            label="Buscando embarazo o ya embarazada"
            onPress={() => router.push("/intention")}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { prediction, isEstimated } = cycle;
  const note = PHASE_NOTES[prediction.phase];
  const PhaseIcon = PHASE_ICONS[prediction.phase];
  const suggestion = PHASE_SUGGESTION[prediction.phase];
  const cycleLength = prediction.cycleDay + prediction.daysUntilNextPeriod;

  const conceiving = intentionState.intention === "conceiving";
  const fertility = conceiving ? getFertilityInfo(prediction, todayStr()) : null;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {fertility ? (
          // Buscando embarazo, el dato que importa es la ventana fértil,
          // no en qué fase está — la fase pasa a la tarjeta de abajo.
          <HeroCard
            gradient={
              fertility.status === "peak" || fertility.status === "fertile"
                ? colors.gradients.folicular
                : colors.gradients.plum
            }
          >
            <Eyebrow tone="onDark">{greeting}</Eyebrow>
            <View style={styles.heroTitleRow}>
              <Text style={[type.heroCompact, styles.heroTitle, { flex: 1 }]}>
                {fertility.status === "approaching"
                  ? `En ${fertility.daysUntilWindow} ${fertility.daysUntilWindow === 1 ? "día" : "días"}`
                  : FERTILITY_COPY[fertility.status].title}
              </Text>
              <SproutIcon size={28} color={colors.onDarkSoft} />
            </View>
            <Text style={[type.body, { color: colors.onDarkSoft }]}>
              {FERTILITY_COPY[fertility.status].detail}
            </Text>

            <View style={styles.heroSpacer} />
            <ProgressBar
              ratio={prediction.cycleDay / Math.max(cycleLength, 1)}
              label={`Ventana: ${formatDateEs(prediction.fertileWindowStart)} al ${formatDateEs(prediction.fertileWindowEnd)}`}
            />
          </HeroCard>
        ) : (
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
        )}

        {conceiving && (
          <FadeInView index={1}>
            <Pressable
              onPress={() => router.push("/library/buscar-embarazo")}
              style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.9 }]}
            >
              <BookIcon size={20} color={colors.clayDeep} />
              <Text style={[type.bodySmall, { color: colors.ink, flex: 1 }]}>
                Esta ventana es una estimación de tus ciclos previos. Cómo leerla y
                qué la hace más precisa.
              </Text>
              <ChevronRightIcon size={16} color={colors.clay} />
            </Pressable>
          </FadeInView>
        )}

        <Card index={2}>
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

        {suggestion && (
          <FadeInView index={3}>
            <Pressable
              onPress={() => router.push(`/library/${suggestion.articleId}`)}
              style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.9 }]}
            >
              <BookIcon size={20} color={colors.clayDeep} />
              <Text style={[type.bodySmall, { color: colors.ink, flex: 1 }]}>
                {suggestion.hook}
              </Text>
              <ChevronRightIcon size={16} color={colors.clay} />
            </Pressable>
          </FadeInView>
        )}

        <FadeInView index={4}>
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
          <FadeInView index={5}>
            <Text style={[type.bodySmall, styles.estimateNote]}>
              Estimado sobre un ciclo de 28 días. Se ajusta solo a medida que
              registrás más períodos.
            </Text>
          </FadeInView>
        )}

        <FadeInView index={6}>
          <Eyebrow>Ahora</Eyebrow>
        </FadeInView>

        <ActionRow
          index={7}
          icon={<CalendarPlusIcon size={21} color={colors.clayDeep} />}
          tint="#F0E2DA"
          title="Mi período empezó hoy"
          subtitle={saving ? "Guardando..." : "Ajusta la predicción al instante"}
          onPress={markPeriodStartToday}
        />
        {sharedActions(8)}

        <QuietButton
          label={conceiving ? "Cambiar objetivo" : "Buscando embarazo o ya embarazada"}
          onPress={() => router.push("/intention")}
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
  heroTitle: { color: colors.onDark, marginTop: space.sm, marginBottom: space.xs },
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
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: "#F5E9E3",
    borderRadius: radius.md,
    padding: space.lg,
  },
});
