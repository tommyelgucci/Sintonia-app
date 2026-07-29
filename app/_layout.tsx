import { Stack } from "expo-router";

const HEADER_STYLE = {
  backgroundColor: "#2C1A4D",
};

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: HEADER_STYLE,
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Sintonía" }} />
      <Stack.Screen name="log" options={{ title: "Registro diario" }} />
      <Stack.Screen name="link" options={{ title: "Vincular pareja" }} />
      <Stack.Screen name="partner" options={{ title: "Su ciclo" }} />
      <Stack.Screen name="pregnancy-setup" options={{ title: "Modo embarazo" }} />
      <Stack.Screen name="health-report" options={{ title: "Reporte de salud" }} />
    </Stack>
  );
}
