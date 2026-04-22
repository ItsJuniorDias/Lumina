import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import "react-native-get-random-values";
import "@ethersproject/shims";

import { GestureHandlerRootView } from "react-native-gesture-handler";

import { WalletConnectModal } from "@walletconnect/modal-react-native";
import { BACKGROUND_IMAGE } from ".";

const projectId = "0e4cda9954115487e9ea3bbf7b934e98";

const providerMetadata = {
  name: "Lumina",
  description: "Lumina App",
  url: "https://lumina.app",
  icons: [BACKGROUND_IMAGE],
};

export default function RootLayout() {
  return (
    <>
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
          <Stack.Screen name="buy-crypto" options={{ animation: "fade" }} />
          <Stack.Screen name="saque-pix" options={{ presentation: "modal" }} />

          {/* Novas Telas de Ação como Modais */}
          <Stack.Screen name="receive" options={{ presentation: "modal" }} />
          <Stack.Screen name="sell" options={{ presentation: "modal" }} />
          <Stack.Screen name="swap" options={{ presentation: "modal" }} />
          <Stack.Screen name="buy" options={{ presentation: "modal" }} />
        </Stack>

        <WalletConnectModal
          projectId={projectId}
          providerMetadata={providerMetadata}
        />
      </GestureHandlerRootView>
    </>
  );
}
