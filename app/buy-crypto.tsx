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
  Image, // <-- Importação adicionada
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { API_BASE_URL } from "@/server/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function BuyCryptoScreen() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState(null);

  const fetchWalletAddress = async () => {
    return await AsyncStorage.getItem("@wallet_address");
  };

  const handleGeneratePix = async () => {
    const parsedAmount = Number(amount.replace(",", "."));

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Erro", "Insira um valor válido em Reais (BRL).");
      return;
    }

    setLoading(true);

    const pushToken = await AsyncStorage.getItem("@lumina_push_token");

    try {
      const response = await fetch(`${API_BASE_URL}/create-pix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountInBRL: parsedAmount,
          walletAddress: await fetchWalletAddress(),
          pushToken: pushToken, // Mandando o token para o backend para notificações futuras
        }),
      });

      const data = await response.json();
      console.log("Resposta do servidor:", data);

      if (data.success) {
        if (data.pixCopiaECola) {
          setPixData(data);
        } else {
          Alert.alert(
            "Aviso",
            `Pedido ${data.orderId} gerado, mas o servidor não retornou o código Pix.`,
          );
        }
      } else {
        Alert.alert("Erro", "Não foi possível gerar a cobrança.");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      Alert.alert("Erro de Conexão", "Servidor indisponível.");
    } finally {
      setLoading(false);
    }
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

          {/* --- NOVO: Contêiner do QR Code --- */}
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
              onPress={() => setPixData(null)}
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
          <Text style={styles.label}>VALOR DO DEPÓSITO (BRL)</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#3A3A3C"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              editable={!loading}
              autoFocus
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, loading && styles.actionButtonDisabled]}
          onPress={handleGeneratePix}
          disabled={loading}
        >
          {loading ? (
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

  // --- NOVOS ESTILOS DO QR CODE ---
  qrCodeContainer: {
    backgroundColor: "#FFFFFF", // Fundo branco obrigatório para o contraste do scanner
    padding: 16,
    borderRadius: 24, // Design iOS
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 24,
  },
  qrCodeImage: {
    width: 200,
    height: 200,
  },
  // --------------------------------

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
