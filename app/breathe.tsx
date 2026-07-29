import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "@/lib/theme";
import { Eyebrow, FadeInView } from "@/lib/ui";

/**
 * Guía de respiración.
 *
 * El círculo hace de metrónomo: se expande mientras inhalás y se contrae
 * mientras exhalás, así el ritmo se sigue mirando en vez de contando. Los
 * dos patrones tienen la exhalación igual o más larga que la inhalación —
 * ahí está el efecto, porque el freno vagal actúa al exhalar. Un patrón
 * con la inhalación más larga activaría al revés.
 */

interface Phase {
  label: string;
  seconds: number;
  /** Tamaño relativo del círculo al terminar esta fase. */
  scale: number;
}

interface Pattern {
  id: string;
  name: string;
  description: string;
  phases: Phase[];
}

const PATTERNS: Pattern[] = [
  {
    id: "calmar",
    name: "Calmar",
    description: "Exhalación larga. Para cuando la ansiedad ya está alta.",
    phases: [
      { label: "Inhalá", seconds: 4, scale: 1 },
      { label: "Sostené", seconds: 7, scale: 1 },
      { label: "Exhalá", seconds: 8, scale: 0.55 },
    ],
  },
  {
    id: "equilibrar",
    name: "Equilibrar",
    description: "Tiempos iguales. Para sostener la calma un rato largo.",
    phases: [
      { label: "Inhalá", seconds: 4, scale: 1 },
      { label: "Sostené", seconds: 4, scale: 1 },
      { label: "Exhalá", seconds: 4, scale: 0.55 },
      { label: "Sostené", seconds: 4, scale: 0.55 },
    ],
  },
];

export default function BreatheScreen() {
  const [pattern, setPattern] = useState<Pattern>(PATTERNS[0]);
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycles, setCycles] = useState(0);

  const scale = useRef(new Animated.Value(0.55)).current;
  // La animación en curso se guarda para poder frenarla al pausar o al
  // cambiar de patrón; si no, sigue corriendo y pisa a la siguiente.
  const animation = useRef<Animated.CompositeAnimation | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!running) return;

    const phase = pattern.phases[phaseIndex];

    animation.current = Animated.timing(scale, {
      toValue: phase.scale,
      duration: phase.seconds * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });
    animation.current.start();

    timer.current = setTimeout(() => {
      const next = (phaseIndex + 1) % pattern.phases.length;
      if (next === 0) setCycles((c) => c + 1);
      setPhaseIndex(next);
    }, phase.seconds * 1000);

    return () => {
      animation.current?.stop();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [running, phaseIndex, pattern, scale]);

  function toggle() {
    if (running) {
      setRunning(false);
      animation.current?.stop();
      if (timer.current) clearTimeout(timer.current);
      return;
    }
    setPhaseIndex(0);
    setRunning(true);
  }

  function choosePattern(p: Pattern) {
    setRunning(false);
    animation.current?.stop();
    if (timer.current) clearTimeout(timer.current);
    setPattern(p);
    setPhaseIndex(0);
    setCycles(0);
    scale.setValue(0.55);
  }

  const current = pattern.phases[phaseIndex];

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <FadeInView>
        <Eyebrow>Respirar</Eyebrow>
        <Text style={[type.title, styles.pageTitle]}>Seguí el círculo</Text>
        <Text style={[type.body, { color: colors.inkSoft }]}>
          No hace falta contar. Inhalá mientras crece, exhalá mientras se achica.
        </Text>
      </FadeInView>

      <FadeInView index={1}>
        <View style={styles.chipRow}>
          {PATTERNS.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => choosePattern(p)}
              style={({ pressed }) => [
                styles.chip,
                pattern.id === p.id && styles.chipSelected,
                pressed && { opacity: 0.82 },
              ]}
            >
              <Text
                style={[
                  type.bodySmall,
                  { color: pattern.id === p.id ? colors.onDark : colors.inkSoft },
                ]}
              >
                {p.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[type.bodySmall, { color: colors.inkFaint, marginTop: space.sm }]}>
          {pattern.description}
        </Text>
      </FadeInView>

      <View style={styles.stage}>
        <Animated.View style={[styles.halo, { transform: [{ scale }] }]} />
        <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
        <View style={styles.stageLabel} pointerEvents="none">
          <Text style={[type.section, { color: colors.ink }]}>
            {running ? current.label : "Listo"}
          </Text>
          {running && (
            <Text style={[type.bodySmall, { color: colors.inkSoft }]}>
              {current.seconds} segundos
            </Text>
          )}
        </View>
      </View>

      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
      >
        <Text style={[type.label, { color: colors.onDark }]}>
          {running ? "Pausar" : cycles > 0 ? "Seguir" : "Empezar"}
        </Text>
      </Pressable>

      {cycles > 0 && (
        <Text style={[type.bodySmall, styles.counter]}>
          {cycles} {cycles === 1 ? "ronda completa" : "rondas completas"}
        </Text>
      )}

      <View style={styles.note}>
        <Text style={[type.bodySmall, { color: colors.inkSoft }]}>
          Si en algún momento te marea o te incomoda, soltá el patrón y volvé a
          respirar normal. No hay que forzarlo — el objetivo es que afloje, no que
          salga perfecto.
        </Text>
      </View>
    </ScrollView>
  );
}

const CIRCLE = 180;

const styles = StyleSheet.create({
  scroll: {
    padding: space.lg,
    gap: space.lg,
    paddingBottom: space.xxl,
    backgroundColor: colors.canvas,
  },
  pageTitle: { color: colors.ink, marginTop: space.xs, marginBottom: space.xs },
  chipRow: { flexDirection: "row", gap: space.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: space.lg,
  },
  chipSelected: { backgroundColor: colors.clay, borderColor: colors.clay },
  stage: {
    height: CIRCLE + space.xxl * 2,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    position: "absolute",
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: "#E4EBE0",
  },
  // Segundo círculo apenas más grande y translúcido: le da un borde suave
  // al movimiento en vez de un canto duro contra el fondo.
  halo: {
    position: "absolute",
    width: CIRCLE + 44,
    height: CIRCLE + 44,
    borderRadius: (CIRCLE + 44) / 2,
    backgroundColor: "rgba(95, 127, 92, 0.10)",
  },
  stageLabel: { alignItems: "center", gap: 2 },
  button: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: "center",
  },
  counter: { color: colors.inkFaint, textAlign: "center" },
  note: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: space.lg,
  },
});
