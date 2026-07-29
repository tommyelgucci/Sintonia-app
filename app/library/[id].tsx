import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { getArticle, CATEGORY_LABELS } from "@/lib/library";
import { colors, radius, space, type } from "@/lib/theme";
import { Eyebrow, FadeInView } from "@/lib/ui";

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = getArticle(id ?? "");

  if (!article) {
    return (
      <View style={styles.missing}>
        <Text style={[type.body, { color: colors.inkSoft }]}>
          No encontramos ese contenido.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ title: CATEGORY_LABELS[article.category] }} />

      <FadeInView>
        <Eyebrow>{`${CATEGORY_LABELS[article.category]} · ${article.readingMinutes} min`}</Eyebrow>
        <Text style={[type.title, styles.title]}>{article.title}</Text>
        <Text style={[type.body, { color: colors.inkSoft }]}>{article.summary}</Text>
      </FadeInView>

      {/* Antes del cuerpo a propósito: quien más necesita esto es quien
          menos va a scrollear hasta el final. */}
      {article.redFlags && (
        <FadeInView index={1}>
          <View style={styles.redFlagBox}>
            <Eyebrow>Consultá sin esperar</Eyebrow>
            <Text style={[type.body, styles.redFlagIntro]}>{article.redFlags.intro}</Text>
            {article.redFlags.items.map((item) => (
              <View key={item} style={styles.flagItem}>
                <View style={styles.flagDot} />
                <Text style={[type.body, { color: colors.ink, flex: 1 }]}>{item}</Text>
              </View>
            ))}
          </View>
        </FadeInView>
      )}

      {article.sections.map((section, i) => (
        <FadeInView key={section.heading} index={2 + i}>
          <View style={styles.section}>
            <Text style={[type.section, styles.sectionHeading]}>{section.heading}</Text>
            <Text style={[type.body, { color: colors.inkSoft }]}>{section.body}</Text>
            {section.bullets && (
              <View style={styles.bulletList}>
                {section.bullets.map((bullet) => (
                  <View key={bullet} style={styles.bulletItem}>
                    <View style={styles.bullet} />
                    <Text style={[type.body, { color: colors.inkSoft, flex: 1 }]}>{bullet}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </FadeInView>
      ))}

      {article.footnote && (
        <FadeInView index={2 + article.sections.length}>
          <View style={styles.footnote}>
            <Text style={[type.bodySmall, { color: colors.inkSoft }]}>{article.footnote}</Text>
          </View>
        </FadeInView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: space.lg,
    gap: space.xl,
    paddingBottom: space.xxl,
    backgroundColor: colors.canvas,
  },
  missing: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
  },
  title: { color: colors.ink, marginTop: space.sm, marginBottom: space.sm },
  redFlagBox: {
    backgroundColor: "#F7EAE4",
    borderRadius: radius.lg,
    padding: space.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.clay,
  },
  redFlagIntro: { color: colors.ink, marginTop: space.sm, marginBottom: space.md },
  flagItem: { flexDirection: "row", gap: space.md, marginBottom: space.sm },
  flagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.clay,
    marginTop: 9,
  },
  section: { gap: space.sm },
  sectionHeading: { color: colors.ink },
  bulletList: { marginTop: space.sm, gap: space.md },
  bulletItem: { flexDirection: "row", gap: space.md },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.inkFaint,
    marginTop: 9,
  },
  footnote: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: space.lg,
  },
});
