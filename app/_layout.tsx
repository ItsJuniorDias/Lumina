import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MetaMaskProvider } from "@metamask/sdk-react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <>
      <MetaMaskProvider
        debug={false}
        sdkOptions={{
          dappMetadata: {
            name: "Lumina",
            url: "https://lumina.app", // Substitua pelo site do seu app, se houver
          },
        }}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ animation: "fade" }} />
            <Stack.Screen name="import" options={{ presentation: "modal" }} />
            <Stack.Screen name="(auth)" options={{ animation: "fade" }} />

            <Stack.Screen name="profile" options={{ animation: "fade" }} />
            <Stack.Screen
              name="ethereum-charts"
              options={{ animation: "fade" }}
            />
            <Stack.Screen
              name="connect-binance"
              options={{ animation: "fade" }}
            />
            <Stack.Screen name="history" options={{ animation: "fade" }} />

            {/* Novas Telas de Ação como Modais */}
            <Stack.Screen name="receive" options={{ presentation: "modal" }} />
            <Stack.Screen name="sell" options={{ presentation: "modal" }} />
            <Stack.Screen name="swap" options={{ presentation: "modal" }} />
            <Stack.Screen name="buy" options={{ presentation: "modal" }} />
          </Stack>
        </GestureHandlerRootView>
      </MetaMaskProvider>
    </>
  );
}
