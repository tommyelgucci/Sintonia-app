import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  Karla_400Regular,
  Karla_500Medium,
  Karla_700Bold,
} from "@expo-google-fonts/karla";
import { colors, fonts } from "@/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {
  // En web no siempre hay splash que ocultar; no es un error que importe.
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Karla_400Regular,
    Karla_500Medium,
    Karla_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  // Renderizar antes de que carguen las fuentes hace que el texto salte de
  // la del sistema a la nuestra a la vista. Preferimos un frame en blanco.
  if (!fontsLoaded) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.canvas },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 17 },
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="log" options={{ title: "Registro diario" }} />
      <Stack.Screen name="calendar" options={{ title: "Calendario" }} />
      <Stack.Screen name="reminders" options={{ title: "Recordatorios" }} />
      <Stack.Screen name="link" options={{ title: "Vincular" }} />
      <Stack.Screen name="account" options={{ title: "Cuenta" }} />
      <Stack.Screen name="partner" options={{ title: "Su ciclo" }} />
      <Stack.Screen name="pregnancy-setup" options={{ title: "Modo embarazo" }} />
      <Stack.Screen name="health-report" options={{ title: "Reporte de salud" }} />
      <Stack.Screen name="library/index" options={{ title: "Aprender" }} />
      <Stack.Screen name="library/[id]" options={{ title: "Aprender" }} />
      <Stack.Screen name="breathe" options={{ title: "Respirar" }} />
      <Stack.Screen name="intention" options={{ title: "Objetivo" }} />
    </Stack>
  );
}
