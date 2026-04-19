import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function SwapScreen() {
  const SwapCard = ({ label, token, balance, amount, isInput }: any) => (
    <BlurView intensity={40} tint="dark" style={styles.swapCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardBalance}>Saldo: {balance}</Text>
      </View>
      <View style={styles.cardBody}>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          placeholderTextColor="rgba(255,255,255,0.2)"
          keyboardType="decimal-pad"
          editable={isInput}
          value={amount}
        />
        <TouchableOpacity style={styles.tokenSelector}>
          <Text style={styles.tokenText}>{token}</Text>
          <Ionicons name="chevron-down" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </BlurView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trocar (Swap)</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <SwapCard label="Você paga" token="ETH" balance="1.45" isInput={true} />

        <View style={styles.swapIconContainer}>
          <Ionicons name="arrow-down" size={24} color="#fff" />
        </View>

        <SwapCard
          label="Você recebe"
          token="USDC"
          balance="450.00"
          amount="0.0"
          isInput={false}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Revisar Troca</Text>
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
  content: { flex: 1, padding: 20, paddingTop: 10 },
  swapCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "500",
  },
  cardBalance: { color: "rgba(255,255,255,0.4)", fontSize: 14 },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountInput: { color: "#fff", fontSize: 32, fontWeight: "700", flex: 1 },
  tokenSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  tokenText: { color: "#fff", fontSize: 16, fontWeight: "600", marginRight: 4 },
  swapIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: -12,
    marginBottom: -12,
    zIndex: 10,
    borderWidth: 4,
    borderColor: "#111",
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
