import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ animation: "fade" }} />
        <Stack.Screen name="import" options={{ presentation: "modal" }} />
        <Stack.Screen name="(auth)" options={{ animation: "fade" }} />

        {/* Novas Telas de Ação como Modais */}
        <Stack.Screen name="receive" options={{ presentation: "modal" }} />
        <Stack.Screen name="send" options={{ presentation: "modal" }} />
        <Stack.Screen name="swap" options={{ presentation: "modal" }} />
        <Stack.Screen name="buy" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
