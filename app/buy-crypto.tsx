import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { API_BASE_URL } from "@/server/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function BuyCryptoScreen() {
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [pixData, setPixData] = useState<any>(null);

  // --- LÓGICA DA TAXA DE 2% ---
  const parsedAmount = Number(amount.replace(",", "."));
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const feePercentage = 0.02; // 2%
  const feeValue = isValidAmount ? parsedAmount * feePercentage : 0;
  const totalAmount = isValidAmount ? parsedAmount + feeValue : 0;

  // 👇 Mutação do TanStack para gerar o Pix
  const pixMutation = useMutation({
    mutationFn: async () => {
      const walletAddress = await AsyncStorage.getItem("@wallet_address");
      const pushToken = await AsyncStorage.getItem("@lumina_push_token");

      const response = await fetch(`${API_BASE_URL}/create-pix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountInBRL: totalAmount,
          walletAddress: walletAddress,
          pushToken: pushToken,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Não foi possível gerar a cobrança.");
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.pixCopiaECola) {
        setPixData(data);
      } else {
        Alert.alert(
          "Aviso",
          `Pedido ${data.orderId} gerado, mas o servidor não retornou o código Pix.`,
        );
      }
    },
    onError: (error: any) => {
      console.error("Erro na requisição:", error);
      Alert.alert("Erro de Conexão", error.message || "Servidor indisponível.");
    },
  });

  const handleGeneratePix = () => {
    if (!isValidAmount) {
      Alert.alert("Erro", "Insira um valor válido em Reais (BRL).");
      return;
    }
    // Dispara a mutação
    pixMutation.mutate();
  };

  const copyToClipboard = async () => {
    if (pixData?.pixCopiaECola) {
      await Clipboard.setStringAsync(pixData.pixCopiaECola);
      Alert.alert(
        "Copiado!",
        "Código Pix copiado para a área de transferência.",
      );
    }
  };

  const handleClosePix = () => {
    // 👇 Invalida o cache da carteira para garantir que o Dashboard puxe o saldo novo
    queryClient.invalidateQueries({ queryKey: ["wallet-binance"] });
    setPixData(null);
  };

  if (pixData) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View>
            <Text style={styles.title}>Pague via Pix</Text>
            <Text style={styles.description}>
              Escaneie o QR Code ou copie o código abaixo. O saldo cairá
              automaticamente na sua carteira.
            </Text>
          </View>

          {pixData.qrCodeBase64 && (
            <View style={styles.qrCodeContainer}>
              <Image
                source={{
                  uri: `data:image/jpeg;base64,${pixData.qrCodeBase64}`,
                }}
                style={styles.qrCodeImage}
              />
            </View>
          )}

          <View style={styles.pixBox}>
            <Text style={styles.pixString} numberOfLines={2}>
              {pixData.pixCopiaECola}
            </Text>
          </View>

          <View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={copyToClipboard}
            >
              <Text style={styles.actionButtonText}>COPIAR CÓDIGO PIX</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleClosePix}
            >
              <Text
                style={[styles.actionButtonText, styles.secondaryButtonText]}
              >
                FECHAR
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Comprar ETH</Text>
          <Text style={styles.description}>
            Deposite reais (BRL) via Pix para receber Ethereum diretamente na
            sua carteira.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>VALOR DA COMPRA (BRL)</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#3A3A3C"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              editable={!pixMutation.isPending}
              autoFocus
            />
          </View>

          {isValidAmount && (
            <View style={styles.feeContainer}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Subtotal:</Text>
                <Text style={styles.feeValue}>
                  R$ {parsedAmount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Taxa de serviço (2%):</Text>
                <Text style={styles.feeValue}>R$ {feeValue.toFixed(2)}</Text>
              </View>
              <View style={[styles.feeRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total a Pagar:</Text>
                <Text style={styles.totalValue}>
                  R$ {totalAmount.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            pixMutation.isPending && styles.actionButtonDisabled,
          ]}
          onPress={handleGeneratePix}
          disabled={pixMutation.isPending}
        >
          {pixMutation.isPending ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.actionButtonText}>GERAR PIX</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: { marginBottom: 40 },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  description: { fontSize: 16, color: "#8E8E93", lineHeight: 22 },
  inputContainer: { flex: 1, justifyContent: "center" },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#1C1C1E",
    paddingBottom: 8,
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: "700",
    color: "#00FFA3",
    marginRight: 12,
  },
  input: { flex: 1, fontSize: 56, fontWeight: "700", color: "#FFFFFF" },

  feeContainer: {
    marginTop: 24,
    backgroundColor: "#111",
    padding: 16,
    borderRadius: 12,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  feeLabel: {
    color: "#8E8E93",
    fontSize: 14,
  },
  feeValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
    marginBottom: 0,
  },
  totalLabel: {
    color: "#00FFA3",
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    color: "#00FFA3",
    fontSize: 16,
    fontWeight: "800",
  },

  qrCodeContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 24,
  },
  qrCodeImage: {
    width: 200,
    height: 200,
  },
  pixBox: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 30,
    alignItems: "center",
  },
  pixString: {
    color: "#00FFA3",
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    textAlign: "center",
  },
  actionButton: {
    backgroundColor: "#00FFA3",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  actionButtonDisabled: { backgroundColor: "#00FFA380" },
  actionButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#000000",
    letterSpacing: 0.8,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#333",
  },
  secondaryButtonText: { color: "#FFF" },
});
