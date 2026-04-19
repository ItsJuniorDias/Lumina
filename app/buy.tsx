import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function BuyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Comprar Cripto</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.currencySymbol}>R$</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0,00"
          placeholderTextColor="rgba(255,255,255,0.2)"
          keyboardType="decimal-pad"
          autoFocus
        />

        <View style={styles.conversionRate}>
          <Text style={styles.conversionText}>≈ 0.052 ETH</Text>
        </View>

        <View style={styles.paymentMethod}>
          <Ionicons name="logo-apple" size={20} color="#fff" />
          <Text style={styles.paymentMethodText}>Apple Pay</Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color="rgba(255,255,255,0.5)"
            style={{ marginLeft: "auto" }}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Continuar para Pagamento</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
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
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  currencySymbol: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  amountInput: {
    color: "#fff",
    fontSize: 72,
    fontWeight: "800",
    textAlign: "center",
    height: 100,
  },
  conversionRate: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    marginTop: 16,
  },
  conversionText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "500",
  },
  paymentMethod: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 16,
    borderRadius: 16,
    marginTop: 40,
  },
  paymentMethodText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "500",
    marginLeft: 12,
  },
  footer: { padding: 20, paddingBottom: 40 },
  primaryButton: {
    backgroundColor: "#fff",
    borderRadius: 100,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: { color: "#000", fontSize: 17, fontWeight: "600" },
});
