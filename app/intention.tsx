import { useRouter } from "expo-router";
import { goBackOrHome } from "@/lib/nav";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { clearPregnancy } from "@/lib/db";
import { useIntention, type Intention } from "@/lib/useIntention";
import { confirmDestructive } from "@/lib/notify";
import { colors, radius, space, type } from "@/lib/theme";
import { Eyebrow, FadeInView } from "@/lib/ui";
import { DropletIcon, SproutIcon, HeartIcon } from "@/lib/icons";

const OPTIONS: {
  value: Intention;
  title: string;
  detail: string;
  icon: typeof DropletIcon;
  tint: string;
  iconColor: string;
}[] = [
  {
    value: "tracking",
    title: "Seguir mi ciclo",
    detail: "Fases, predicción del período y registro de síntomas.",
    icon: DropletIcon,
    tint: "#F0E2DA",
    iconColor: "#7E3D2D",
  },
  {
    value: "conceiving",
    title: "Buscando embarazo",
    detail: "Lo mismo, pero con la ventana fértil al frente.",
    icon: SproutIcon,
    tint: "#E1E9DD",
    iconColor: "#4F6E50",
  },
  {
    value: "pregnant",
    title: "Estoy embarazada",
    detail: "Semana a semana, con fecha probable de parto.",
    icon: HeartIcon,
    tint: "#E8E0EA",
    iconColor: "#6B4C71",
  },
];

export default function IntentionScreen() {
  const router = useRouter();
  const { intention, loading, setIntention, reload } = useIntention();

  async function choose(next: Intention) {
    if (next === "pregnant") {
      // El modo embarazo necesita una fecha, así que no se activa desde
      // acá: se elige la fecha y esa carga es la que lo enciende.
      router.push("/pregnancy-setup");
      return;
    }

    if (intention === "pregnant") {
      confirmDestructive(
        "Salir del modo embarazo",
        "No se borra nada de lo que registraste, solo dejás de ver el progreso semanal.",
        async () => {
          await clearPregnancy();
          await setIntention(next);
          await reload();
          goBackOrHome();
        }
      );
      return;
    }

    await setIntention(next);
    goBackOrHome();
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
        <Eyebrow>Objetivo</Eyebrow>
        <Text style={[type.title, styles.pageTitle]}>¿Para qué la estás usando?</Text>
        <Text style={[type.body, { color: colors.inkSoft }]}>
          Cambia qué se muestra primero. Podés cambiarlo cuando quieras y no se
          pierde nada de lo registrado.
        </Text>
      </FadeInView>

      {OPTIONS.map((option, i) => {
        const selected = intention === option.value;
        const Icon = option.icon;
        return (
          <FadeInView key={option.value} index={1 + i}>
            <Pressable
              onPress={() => choose(option.value)}
              style={({ pressed }) => [
                styles.card,
                selected && styles.cardSelected,
                pressed && { opacity: 0.9 },
              ]}
            >
              <View style={[styles.iconTile, { backgroundColor: option.tint }]}>
                <Icon size={22} color={option.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.cardTitle, { color: colors.ink }]}>{option.title}</Text>
                <Text style={[type.bodySmall, { color: colors.inkSoft, marginTop: 2 }]}>
                  {option.detail}
                </Text>
              </View>
              {selected && (
                <View style={styles.activePill}>
                  <Text style={[type.bodySmall, { color: colors.onDark }]}>Activo</Text>
                </View>
              )}
            </Pressable>
          </FadeInView>
        );
      })}
    </ScrollView>
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
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: { borderColor: colors.clay },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    backgroundColor: colors.clay,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: space.md,
  },
});
