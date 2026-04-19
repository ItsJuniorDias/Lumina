import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Aqui entraria uma imagem de fundo abstrata ou um gradiente escuro */}
      <View style={styles.backgroundMock}>
        <Text style={styles.logoText}>Lumina</Text>
      </View>

      {/* O Painel Translúcido (Glassmorphism) na parte inferior */}
      <View style={styles.bottomSheetContainer}>
        <BlurView intensity={40} tint="dark" style={styles.glassPanel}>
          <Text style={styles.title}>O seu portal para a Web3.</Text>
          <Text style={styles.subtitle}>Simples, seguro e invisível.</Text>

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Criar Nova Carteira</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.6}>
            <Text style={styles.secondaryButtonText}>
              Já tenho uma carteira
            </Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  backgroundMock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  logoText: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  bottomSheetContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    paddingHorizontal: 20,
  },
  glassPanel: {
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)", // A borda sutil é o segredo do glassmorphism
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: "#ffffff",
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
});
