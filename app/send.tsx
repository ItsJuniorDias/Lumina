import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

export default function SendScreen() {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");

  const handleMax = () => {
    Haptics.selectionAsync();
    setAmount("1.45"); // Exemplo: Saldo máximo de ETH do utilizador
  };

  const handleReview = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Avançar para a tela de confirmação/assinatura
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Enviar</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Secção do Destinatário */}
            <Text style={styles.sectionLabel}>Para</Text>
            <BlurView intensity={40} tint="dark" style={styles.addressCard}>
              <TextInput
                style={styles.addressInput}
                placeholder="Endereço, ENS ou Lumina ID"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={address}
                onChangeText={setAddress}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="qr-code-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </BlurView>

            {/* Secção do Ativo e Valor */}
            <View style={styles.assetRow}>
              <Text style={styles.sectionLabel}>Quantia</Text>
              <TouchableOpacity style={styles.assetSelector}>
                <View
                  style={[styles.assetIcon, { backgroundColor: "#627EEA" }]}
                />
                <Text style={styles.assetName}>ETH</Text>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color="rgba(255,255,255,0.5)"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.amountContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
              <Text style={styles.fiatConversion}>
                ≈ R$ {amount ? (parseFloat(amount) * 10200).toFixed(2) : "0,00"}
              </Text>
            </View>

            {/* Saldo e Botão Max */}
            <View style={styles.balanceRow}>
              <Text style={styles.balanceText}>Saldo: 1.45 ETH</Text>
              <TouchableOpacity style={styles.maxButton} onPress={handleMax}>
                <Text style={styles.maxButtonText}>MÁX</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer com Botão de Ação */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!address || !amount) && styles.primaryButtonDisabled,
              ]}
              activeOpacity={0.8}
              disabled={!address || !amount}
              onPress={handleReview}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  (!address || !amount) && styles.primaryButtonTextDisabled,
                ]}
              >
                Revisar Envio
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
    backgroundColor: "#111",
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 40,
    overflow: "hidden",
  },
  addressInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    height: 40,
  },
  iconButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 100,
    marginLeft: 12,
  },
  assetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  assetSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  assetIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  assetName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
  },
  amountContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  amountInput: {
    color: "#fff",
    fontSize: 64,
    fontWeight: "800",
    textAlign: "center",
    height: 90,
  },
  fiatConversion: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    fontWeight: "500",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  balanceText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    marginRight: 12,
  },
  maxButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  maxButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  primaryButton: {
    backgroundColor: "#fff",
    borderRadius: 100,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 17,
    fontWeight: "600",
  },
  primaryButtonTextDisabled: {
    color: "rgba(255,255,255,0.3)",
  },
});
