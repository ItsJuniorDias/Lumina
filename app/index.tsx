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

const BACKGROUND_IMAGE =
  "https://images.unsplash.com/photo-1641580546594-cab974df226d?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export default function OnboardingScreen() {
  const handleCreateWallet = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/(auth)/dashboard");
  };

  const handleImportWallet = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navega para a tela import.tsx que acabamos de criar
    router.push("/import");
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
        {/* Overlay Escuro: Garante que o texto e o vidro fiquem legíveis sobre a imagem */}
        <LinearGradient
          colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.8)"]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.contentMock}>
          <Text style={styles.logoText}>Lumina</Text>
        </View>

        <View style={styles.bottomSheetContainer}>
          <BlurView intensity={25} tint="dark" style={styles.glassPanel}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>O portal para a Web3.</Text>
              <Text style={styles.subtitle}>Simples, seguro e invisível.</Text>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={handleCreateWallet}
            >
              <Text style={styles.primaryButtonText}>Criar Nova Carteira</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.7}
              onPress={handleImportWallet}
            >
              <Text style={styles.secondaryButtonText}>
                Já tenho uma carteira
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
    // Uma leve sombra no texto ajuda a destacá-lo da imagem de fundo
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
    backgroundColor: "rgba(30, 30, 30, 0.4)",
  },
  textContainer: {
    marginBottom: 40,
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
    fontSize: 17,
    fontWeight: "400",
    letterSpacing: -0.4,
  },
  primaryButton: {
    backgroundColor: "#ffffff",
    borderRadius: 100,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "500",
  },
});
