import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, shadow, space, type } from "./theme";
import { ChevronRightIcon } from "./icons";

/**
 * Entrada escalonada de los bloques de una pantalla. Sube 12px y aparece,
 * con un delay proporcional al índice: la vista se "arma" de arriba hacia
 * abajo en vez de aparecer entera de golpe, que es lo que hace que se
 * sienta fluida sin llamar la atención sobre la animación misma.
 *
 * useNativeDriver corre la animación en el hilo de UI (en web, sobre
 * transform/opacity compuestos), así que no se traba mientras se leen los
 * datos de SQLite.
 */
export function FadeInView({
  children,
  index = 0,
  style,
}: {
  children: React.ReactNode;
  index?: number;
  style?: ViewStyle;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay: index * 70,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [progress, index]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function Eyebrow({ children, tone = "soft" }: { children: string; tone?: "soft" | "onDark" }) {
  return (
    <Text
      style={[
        type.eyebrow,
        { color: tone === "onDark" ? colors.onDarkFaint : colors.inkFaint },
      ]}
    >
      {children.toUpperCase()}
    </Text>
  );
}

export function Card({
  children,
  style,
  index = 0,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  index?: number;
}) {
  return (
    <FadeInView index={index}>
      <View style={[styles.card, style]}>{children}</View>
    </FadeInView>
  );
}

/** Tarjeta héroe: el degradado envolvente que ancla cada pantalla. */
export function HeroCard({
  gradient,
  children,
  index = 0,
}: {
  gradient: readonly [string, string];
  children: React.ReactNode;
  index?: number;
}) {
  return (
    <FadeInView index={index}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.hero}
      >
        {children}
      </LinearGradient>
    </FadeInView>
  );
}

/** Barra de progreso que se llena al montar, con la etiqueta al costado. */
export function ProgressBar({
  ratio,
  label,
  tone = "onDark",
}: {
  ratio: number;
  label?: string;
  tone?: "onDark" | "ink";
}) {
  const width = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(1, ratio));

  useEffect(() => {
    Animated.timing(width, {
      toValue: clamped,
      duration: 900,
      delay: 220,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      // El ancho no es una propiedad compuesta, así que esta sí corre en JS.
      useNativeDriver: false,
    }).start();
  }, [width, clamped]);

  const trackColor = tone === "onDark" ? "rgba(251,247,242,0.22)" : colors.line;
  const fillColor = tone === "onDark" ? colors.onDark : colors.clay;

  return (
    <View style={styles.progressRow}>
      <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: fillColor,
              width: width.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      {label && (
        <Text
          style={[
            type.bodySmall,
            { color: tone === "onDark" ? colors.onDarkSoft : colors.inkSoft },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

/** Fila navegable con tile de icono, como los "Tu día" de la referencia. */
export function ActionRow({
  icon,
  title,
  subtitle,
  tint,
  onPress,
  index = 0,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  tint: string;
  onPress?: () => void;
  index?: number;
}) {
  return (
    <FadeInView index={index}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
      >
        <View style={[styles.iconTile, { backgroundColor: tint }]}>{icon}</View>
        <View style={styles.actionRowText}>
          <Text style={[type.cardTitle, { color: colors.ink }]}>{title}</Text>
          {subtitle && (
            <Text style={[type.bodySmall, { color: colors.inkSoft }]}>{subtitle}</Text>
          )}
        </View>
        <ChevronRightIcon size={18} color={colors.inkFaint} />
      </Pressable>
    </FadeInView>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && styles.pressed,
        disabled && { opacity: 0.6 },
      ]}
    >
      <Text style={[type.label, { color: colors.onDark }]}>{label}</Text>
    </Pressable>
  );
}

export function QuietButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quietButton, pressed && styles.pressed]}>
      <Text style={[type.label, { color: colors.clay }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    ...shadow.card,
  },
  hero: {
    borderRadius: radius.lg + 4,
    padding: space.xl,
    ...shadow.raised,
  },
  progressRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: radius.pill },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    ...shadow.card,
  },
  actionRowText: { flex: 1, gap: 2 },
  iconTile: {
    width: 42,
    height: 42,
    borderRadius: radius.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: "center",
  },
  quietButton: { paddingVertical: space.md, alignItems: "center" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
