import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/server/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function BuyScreen() {
  const [usdtAmount, setUsdtAmount] = useState("");
  const [ethAmount, setEthAmount] = useState("0.000000");

  const queryClient = useQueryClient();

  const MIN_PURCHASE_USDT = 10.0;
  const PLATFORM_FEE_PERCENTAGE = 0.02; // 2% da plataforma

  // 👇 1. Substituímos o useEffect pelo useQuery para o preço do ETH
  const { data: ethPrice = 0 } = useQuery({
    queryKey: ["eth-price-usd"],
    queryFn: async () => {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      );
      const data = await response.json();
      return data.ethereum.usd;
    },
    refetchInterval: 15000, // Atualiza a cotação a cada 15 segundos enquanto a tela estiver aberta
  });

  // Recalcula a estimativa de ETH
  useEffect(() => {
    const val = parseFloat(usdtAmount.replace(",", "."));
    if (!isNaN(val) && val > 0 && ethPrice > 0) {
      const investableAmount = val * (1 - PLATFORM_FEE_PERCENTAGE);
      setEthAmount((investableAmount / ethPrice).toFixed(6));
    } else {
      setEthAmount("0.000000");
    }
  }, [usdtAmount, ethPrice]);

  const handleAmountChange = (text: string) => {
    let cleaned = text.replace(/[^0-9,.]/g, "").replace(",", ".");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) {
      cleaned = `${parts[0]}.${parts[1].substring(0, 2)}`;
    }
    setUsdtAmount(cleaned);
  };

  // 👇 2. Criamos a Mutação para a Compra
  const buyMutation = useMutation({
    mutationFn: async (cleanAmount: number) => {
      const response = await api.post("/buy-eth", {
        amountInUSDT: cleanAmount,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Falha na execução.");
      }
      return response.data.receipt;
    },
    onSuccess: (receipt) => {
      // 👇 A MÁGICA: Invalida o cache da Dashboard
      queryClient.invalidateQueries({ queryKey: ["wallet-binance"] });

      let successMessage = "Ordem executada com sucesso na Binance.";
      if (receipt) {
        successMessage =
          `Valor Solicitado: $${receipt.requestedAmount}\n` +
          `Taxa Retida (2%): $${receipt.platformFeeApplied.toFixed(2)}\n` +
          `Executado na Rede: $${receipt.actualExecutedOnBinance}`;
      }

      Alert.alert("TRANSAÇÃO CONCLUÍDA", successMessage, [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      console.error(error);
      Alert.alert(
        "FALHA NO CONTRATO",
        error.message ||
          "Não foi possível conectar com a Binance. Verifique seu saldo em USDT.",
      );
    },
  });

  const handlePurchase = () => {
    const cleanAmount = parseFloat(usdtAmount);

    if (!usdtAmount || isNaN(cleanAmount) || cleanAmount <= 0) {
      Alert.alert(
        "Erro de Roteamento",
        "Insira um valor válido para executar a ordem.",
      );
      return;
    }

    if (cleanAmount < MIN_PURCHASE_USDT) {
      Alert.alert(
        "Ordem Rejeitada",
        `A rede exige um mínimo de $${MIN_PURCHASE_USDT.toFixed(2)} USDT por transação.`,
      );
      return;
    }

    // Dispara a mutação
    buyMutation.mutate(cleanAmount);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SWAP USDT // ETH</Text>
          <Text style={styles.subtitle}>Market Execution</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
          disabled={buyMutation.isPending}
        >
          <Ionicons name="close" size={24} color="#888" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentScroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.terminalLabel}>[ AMOUNT_TO_SPEND ]</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor="#333"
            keyboardType="decimal-pad"
            value={usdtAmount}
            onChangeText={handleAmountChange}
            editable={!buyMutation.isPending}
            autoFocus
          />
          <Text style={styles.currencySuffix}>USDT</Text>
        </View>

        <View style={styles.conversionRate}>
          <Ionicons
            name="swap-vertical"
            size={16}
            color="#00FFA3"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.conversionText}>≈ {ethAmount} ETH</Text>
        </View>

        <View style={styles.receiptBox}>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>NETWORK_RATE</Text>
            <Text style={styles.receiptValue}>
              1 ETH = ${ethPrice > 0 ? ethPrice.toLocaleString("en-US") : "---"}
            </Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>ROUTING</Text>
            <Text style={styles.receiptValue}>Lumina / Binance API</Text>
          </View>
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>PLATFORM_FEE</Text>
            <Text style={styles.receiptValue}>2.00%</Text>
          </View>
          {usdtAmount && !isNaN(parseFloat(usdtAmount)) ? (
            <View
              style={[
                styles.receiptRow,
                {
                  marginTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: "#222",
                  paddingTop: 8,
                },
              ]}
            >
              <Text style={[styles.receiptLabel, { color: "#00FFA3" }]}>
                ESTIMATED_FEE
              </Text>
              <Text style={[styles.receiptValue, { color: "#00FFA3" }]}>
                ${(parseFloat(usdtAmount) * PLATFORM_FEE_PERCENTAGE).toFixed(2)}{" "}
                USDT
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            buyMutation.isPending && styles.primaryButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={buyMutation.isPending}
        >
          {buyMutation.isPending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryButtonText}>EXECUTE ORDER</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  title: { color: "#FFF", fontSize: 20, fontWeight: "800", letterSpacing: 1 },
  subtitle: {
    color: "#00FFA3",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: "#111",
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222",
  },

  scrollContainer: { flex: 1 },
  contentScroll: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 130,
  },

  terminalLabel: {
    color: "#444",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 2,
    alignSelf: "flex-start",
    marginBottom: 16,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    width: "100%",
    marginBottom: 24,
  },
  currencySymbol: {
    color: "#00FFA3",
    fontSize: 32,
    fontWeight: "600",
    marginBottom: 8,
    marginRight: 8,
  },
  amountInput: {
    color: "#FFF",
    fontSize: 72,
    fontWeight: "900",
    textAlign: "center",
  },
  currencySuffix: {
    color: "#444",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    marginLeft: 8,
  },

  conversionRate: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  conversionText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 18,
    letterSpacing: 1,
  },

  receiptBox: {
    width: "100%",
    backgroundColor: "#0A0A0A",
    borderRadius: 16,
    padding: 20,
    marginTop: 40,
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  receiptLabel: {
    color: "#666",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  receiptValue: {
    color: "#AAA",
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },

  footer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 24,
    left: 24,
    right: 24,
  },
  primaryButton: {
    backgroundColor: "#00FFA3",
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00FFA3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonDisabled: {
    backgroundColor: "#00FFA340",
    shadowOpacity: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 2,
  },
});
