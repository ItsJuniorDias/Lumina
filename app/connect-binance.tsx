import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ConnectBinanceScreen() {
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleConnect = async () => {
    if (!apiKey.trim() || !secretKey.trim()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMessage("Por favor, preencha as duas chaves.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // 1. Salvar as chaves no AsyncStorage
      await AsyncStorage.setItem("@binance_api_key", apiKey);
      await AsyncStorage.setItem("@binance_secret_key", secretKey);

      // Simulando um delay de rede (2 segundos)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 2. Sucesso! Redireciona para o Dashboard
      router.replace("/(auth)/dashboard");
    } catch (error) {
      console.error("Erro ao salvar/conectar:", error);
      setErrorMessage("Falha ao salvar as chaves da Binance. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["#111", "#000"]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.topSection}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="finance"
                size={40}
                color="#F3BA2F"
              />
            </View>
            <Text style={styles.title}>Conectar Binance</Text>
            <Text style={styles.subtitle}>
              Crie uma API Key na sua conta da Binance com permissão de{" "}
              <Text style={{ fontWeight: "bold", color: "#fff" }}>
                Apenas Leitura
              </Text>{" "}
              e cole as chaves abaixo.
            </Text>
          </View>

          <View style={styles.formSection}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={20} color="#FF453A" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>API Key</Text>
              <TextInput
                style={styles.input}
                placeholder="Insira sua API Key"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={apiKey}
                onChangeText={setApiKey}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Secret Key</Text>
              <TextInput
                style={styles.input}
                placeholder="Insira sua Secret Key"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={secretKey}
                onChangeText={setSecretKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.footerSection}>
            <TouchableOpacity
              style={[
                styles.connectButton,
                isLoading && styles.connectButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleConnect}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.connectButtonText}>Conectar Carteira</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.helpButton}>
              <Text style={styles.helpText}>Como criar uma API Key?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  topSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(243, 186, 47, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 69, 58, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 69, 58, 0.3)",
  },
  errorText: {
    color: "#FF453A",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    color: "#fff",
    fontSize: 16,
  },
  footerSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    paddingTop: 20,
  },
  connectButton: {
    backgroundColor: "#F3BA2F",
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  connectButtonDisabled: {
    opacity: 0.7,
  },
  connectButtonText: {
    color: "#000",
    fontSize: 17,
    fontWeight: "700",
  },
  helpButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  helpText: {
    color: "#F3BA2F",
    fontSize: 14,
    fontWeight: "600",
  },
});
