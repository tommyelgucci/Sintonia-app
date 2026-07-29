import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ARTICLES, CATEGORY_LABELS, type ArticleCategory } from "@/lib/library";
import { colors, radius, space, type } from "@/lib/theme";
import { Eyebrow, FadeInView } from "@/lib/ui";
import { ChevronRightIcon, HeartIcon } from "@/lib/icons";

const CATEGORY_TINTS: Record<ArticleCategory, string> = {
  cuerpo: "#F0E2DA",
  anticoncepcion: "#E8E0EA",
  calma: "#E1E9DD",
  condiciones: "#F5E7D2",
};

const CATEGORY_ORDER: ArticleCategory[] = ["cuerpo", "calma", "anticoncepcion", "condiciones"];

export default function LibraryScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <FadeInView>
        <Eyebrow>Aprender</Eyebrow>
        <Text style={[type.title, styles.pageTitle]}>Sobre tu cuerpo, sin vueltas</Text>
        <Text style={[type.body, { color: colors.inkSoft }]}>
          Lo que suele explicarse mal o directamente no se explica.
        </Text>
      </FadeInView>

      <FadeInView index={1}>
        <Pressable
          onPress={() => router.push("/breathe")}
          style={({ pressed }) => [styles.breatheCard, pressed && { opacity: 0.9 }]}
        >
          <View style={styles.breatheIcon}>
            <HeartIcon size={22} color="#4F6E50" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[type.cardTitle, { color: colors.ink }]}>Respirar un minuto</Text>
            <Text style={[type.bodySmall, { color: colors.inkSoft }]}>
              Guía visual para bajar revoluciones
            </Text>
          </View>
          <ChevronRightIcon size={18} color={colors.inkFaint} />
        </Pressable>
      </FadeInView>

      {CATEGORY_ORDER.map((category, ci) => {
        const items = ARTICLES.filter((a) => a.category === category);
        if (items.length === 0) return null;

        return (
          <View key={category} style={styles.group}>
            <FadeInView index={2 + ci}>
              <Eyebrow>{CATEGORY_LABELS[category]}</Eyebrow>
            </FadeInView>

            {items.map((article, i) => (
              <FadeInView key={article.id} index={2 + ci + i}>
                <Pressable
                  onPress={() => router.push(`/library/${article.id}`)}
                  style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
                >
                  <View style={[styles.stripe, { backgroundColor: CATEGORY_TINTS[category] }]} />
                  <View style={styles.cardBody}>
                    <Text style={[type.cardTitle, { color: colors.ink }]}>{article.title}</Text>
                    <Text style={[type.bodySmall, { color: colors.inkSoft, marginTop: 2 }]}>
                      {article.summary}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={[type.bodySmall, { color: colors.inkFaint }]}>
                        {article.readingMinutes} min de lectura
                      </Text>
                      {article.redFlags && (
                        <View style={styles.flagPill}>
                          <Text style={[type.bodySmall, { color: colors.clayDeep }]}>
                            Incluye señales de alarma
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              </FadeInView>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: space.lg,
    gap: space.lg,
    paddingBottom: space.xxl,
    backgroundColor: colors.canvas,
  },
  pageTitle: { color: colors.ink, marginTop: space.xs, marginBottom: space.xs },
  group: { gap: space.sm },
  breatheCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  breatheIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.sm + 2,
    backgroundColor: "#E1E9DD",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  // Franja de color al costado en vez de un tile de icono: distingue la
  // categoría sin inventar un pictograma por tema.
  stripe: { width: 6 },
  cardBody: { flex: 1, padding: space.lg },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.md,
    flexWrap: "wrap",
  },
  flagPill: {
    backgroundColor: "#F5E9E3",
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: space.md,
  },
});
