import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { askAboutCycle } from "@/lib/ai";
import {
  AI_DISCLAIMER,
  AI_DISCLOSURE,
  MAX_QUESTION_CHARS,
  SUGGESTED_QUESTIONS,
  validateQuestion,
} from "@/lib/aiRules";
import { listDailyLogs } from "@/lib/db";
import { useCyclePrediction } from "@/lib/useCyclePrediction";
import { colors, radius, space, type } from "@/lib/theme";
import { Card, Eyebrow, FadeInView, PrimaryButton, QuietButton } from "@/lib/ui";

export default function AssistantScreen() {
  const router = useRouter();
  const cycle = useCyclePrediction();
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      cycle.reload();
    }, [cycle.reload])
  );

  async function ask() {
    const problem = validateQuestion(question);
    if (problem) {
      setError(problem);
      return;
    }
    if (!cycle.prediction) return;
    setAsking(true);
    setError(null);
    setAnswer(null);
    try {
      const recentLogs = await listDailyLogs();
      setAnswer(
        await askAboutCycle({
          question: question.trim(),
          prediction: cycle.prediction,
          recentLogs,
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos obtener una respuesta.");
    } finally {
      setAsking(false);
    }
  }

  if (cycle.loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.clay} />
      </View>
    );
  }

  if (!cycle.prediction) {
    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <Eyebrow>Preguntar</Eyebrow>
          <Text style={[type.title, styles.pageTitle]}>Primero una fecha</Text>
          <Text style={[type.body, { color: colors.inkSoft }]}>
            Para responder con sentido necesito saber en qué día de tu ciclo estás.
            Registrá cuándo empezó tu último período y volvé.
          </Text>
        </FadeInView>
        <QuietButton label="Volver al inicio" onPress={() => router.replace("/")} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <FadeInView>
        <Eyebrow>Preguntar</Eyebrow>
        <Text style={[type.title, styles.pageTitle]}>¿Qué querés saber?</Text>
        <Text style={[type.body, { color: colors.inkSoft }]}>{AI_DISCLAIMER}</Text>
      </FadeInView>

      <Card index={1}>
        <TextInput
          style={[styles.input, type.body]}
          placeholder="Escribí tu pregunta..."
          placeholderTextColor={colors.inkFaint}
          multiline
          maxLength={MAX_QUESTION_CHARS}
          value={question}
          onChangeText={(t) => {
            setQuestion(t);
            setError(null);
          }}
          editable={!asking}
        />
        <View style={styles.chips}>
          {SUGGESTED_QUESTIONS.map((q) => (
            <Pressable
              key={q}
              disabled={asking}
              onPress={() => {
                setQuestion(q);
                setError(null);
              }}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            >
              <Text style={[type.bodySmall, { color: colors.ink }]}>{q}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[type.bodySmall, { color: colors.inkFaint, marginTop: space.md }]}>
          {AI_DISCLOSURE}
        </Text>
      </Card>

      <FadeInView index={2}>
        <PrimaryButton
          label={asking ? "Pensando..." : "Preguntar"}
          onPress={ask}
          disabled={asking}
        />
      </FadeInView>

      {asking && <ActivityIndicator color={colors.clay} />}

      {error && (
        <Text style={[type.body, { color: colors.clayDeep }]} accessibilityRole="alert">
          {error}
        </Text>
      )}

      {answer && (
        <Card>
          <Eyebrow>Respuesta</Eyebrow>
          <Text style={[type.body, { color: colors.ink, marginTop: space.sm }]} selectable>
            {answer}
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { padding: space.xl, gap: space.lg, paddingBottom: space.xxl },
  pageTitle: { color: colors.ink, marginVertical: space.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: space.md,
    minHeight: 96,
    color: colors.ink,
    textAlignVertical: "top",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    backgroundColor: colors.surfaceMuted,
  },
  pressed: { opacity: 0.82 },
});
