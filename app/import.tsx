import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

export default function ImportWalletScreen() {
  const [seedPhrase, setSeedPhrase] = useState("");

  const handleBack = async () => {
    await Haptics.selectionAsync();
    router.back();
  };

  const handleImport = async () => {
    if (seedPhrase.trim().length < 20) return; // Validação simples
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Aqui entraria a lógica do ethers.js ou viem para validar a frase
    router.replace("/(auth)/dashboard");
  };

  // Ativa o botão apenas se o usuário digitou algo considerável
  const isButtonActive = seedPhrase.trim().length > 20;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* Header de Navegação Nativa */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Ionicons name="chevron-back" size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Área de Texto */}
          <View style={styles.textSection}>
            <Text style={styles.title}>Restaurar Cofre</Text>
            <Text style={styles.subtitle}>
              Insira a sua frase secreta de 12 ou 24 palavras separadas por
              espaço para recuperar o acesso.
            </Text>
          </View>

          {/* Área do Input com Glassmorphism */}
          <BlurView intensity={40} tint="dark" style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ex: alpha bravo charlie delta..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              value={seedPhrase}
              onChangeText={setSeedPhrase}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            {/* Botão de colar rápido para UX premium */}
            {seedPhrase.length === 0 && (
              <TouchableOpacity style={styles.pasteButton}>
                <Ionicons name="clipboard-outline" size={16} color="#ffffff" />
                <Text style={styles.pasteText}>Colar</Text>
              </TouchableOpacity>
            )}
          </BlurView>

          {/* Espaçador flexível para empurrar o botão para baixo */}
          <View style={{ flex: 1 }} />

          {/* Botão Principal */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                !isButtonActive && styles.primaryButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleImport}
              disabled={!isButtonActive}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  !isButtonActive && styles.primaryButtonTextDisabled,
                ]}
              >
                Restaurar Carteira
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60, // Espaço para a status bar
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    marginLeft: -8, // Compensa o padding do ícone para alinhar à esquerda
  },
  backButton: {
    padding: 8,
  },
  textSection: {
    marginBottom: 32,
  },
  title: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 0.35,
    marginBottom: 12,
  },
  subtitle: {
    color: "rgba(235, 235, 245, 0.6)",
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  inputContainer: {
    borderRadius: 24,
    minHeight: 160,
    padding: 20,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(30, 30, 30, 0.4)",
  },
  textInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 28,
    textAlignVertical: "top", // Importante para multiline no Android
  },
  pasteButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  pasteText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  footer: {
    paddingBottom: Platform.OS === "ios" ? 16 : 24,
  },
  primaryButton: {
    backgroundColor: "#ffffff",
    borderRadius: 100,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  primaryButtonText: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "600",
  },
  primaryButtonTextDisabled: {
    color: "rgba(255, 255, 255, 0.3)",
  },
});
