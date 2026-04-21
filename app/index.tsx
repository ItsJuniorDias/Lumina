import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKGROUND_IMAGE =
  "https://images.unsplash.com/photo-1641580546594-cab974df226d?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export default function OnboardingScreen() {
  const loadKeys = async () => {
    try {
      const savedApiKey = await AsyncStorage.getItem("@binance_api_key");
      const savedSecretKey = await AsyncStorage.getItem("@binance_secret_key");

      console.log("Chaves carregadas:", { savedApiKey, savedSecretKey });

      return { apiKey: savedApiKey, secretKey: savedSecretKey };
    } catch (error) {
      console.error("Erro ao ler as chaves", error);
    }
  };

  // Conexão exclusiva com Binance
  const handleConnectBinance = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Redireciona para a tela onde o usuário vai inserir as API Keys

    const keys = await loadKeys();

    if (keys?.apiKey && keys?.secretKey) {
      router.replace("/(auth)/dashboard");
    } else {
      router.push("/connect-binance");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Imagem de Fundo */}
      <ImageBackground
        source={{ uri: BACKGROUND_IMAGE }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        {/* Overlay Escuro */}
        <LinearGradient
          colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.9)"]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.contentMock}>
          <Text style={styles.logoText}>Lumina</Text>
        </View>

        <View style={styles.bottomSheetContainer}>
          <BlurView intensity={30} tint="dark" style={styles.glassPanel}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>O portal para a Web3.</Text>
              <Text style={styles.subtitle}>
                Conecte sua conta da Binance. Simples, seguro e invisível.
              </Text>
            </View>

            {/* Botão Binance */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: "#F3BA2F" }]} // Cor da Binance
              activeOpacity={0.85}
              onPress={handleConnectBinance}
            >
              <MaterialCommunityIcons
                name="finance"
                size={24}
                color="#000"
                style={styles.buttonIcon}
              />
              <Text style={[styles.primaryButtonText, { color: "#000" }]}>
                Conectar Binance
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  contentMock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 150,
  },
  logoText: {
    color: "#ffffff",
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  bottomSheetContainer: {
    position: "absolute",
    bottom: 34,
    width: "100%",
    paddingHorizontal: 16,
  },
  glassPanel: {
    borderRadius: 32,
    padding: 24,
    paddingTop: 32,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(30, 30, 30, 0.5)",
  },
  textContainer: {
    marginBottom: 32,
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.35,
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(235, 235, 245, 0.6)",
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: -0.4,
  },
  primaryButton: {
    flexDirection: "row",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12, // Mantido um respiro inferior caso o layout do celular precise
  },
  buttonIcon: {
    marginRight: 10,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
});
