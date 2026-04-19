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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { api } from "@/server/api";

export default function BuyScreen() {
  const [brlAmount, setBrlAmount] = useState("");
  const [ethAmount, setEthAmount] = useState("0.00");
  const [ethPrice, setEthPrice] = useState(0); // Preço de 1 ETH em BRL
  const [loading, setLoading] = useState(false);

  // Endereço da carteira do usuário (Substitua pela lógica de Auth/Wallet do seu app)
  const USER_WALLET = "0x4bc1B5e71d30F726eF38e638af080255Fe775fC9";

  // 1. Busca a cotação real do ETH/BRL ao abrir a tela
  useEffect(() => {
    async function fetchPrice() {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=brl",
        );
        const data = await response.json();
        setEthPrice(data.ethereum.brl);
      } catch (error) {
        console.error("Erro ao buscar cotação:", error);
        // Fallback caso a API falhe (ex: cotação aproximada)
        setEthPrice(18000);
      }
    }
    fetchPrice();
  }, []);

  // 2. Calcula a conversão em tempo real
  useEffect(() => {
    const val = parseFloat(brlAmount.replace(",", "."));
    if (val > 0 && ethPrice > 0) {
      setEthAmount((val / ethPrice).toFixed(6));
    } else {
      setEthAmount("0.00");
    }
  }, [brlAmount, ethPrice]);

  const handlePurchase = async () => {
    const cleanAmount = parseFloat(brlAmount.replace(",", "."));

    if (!brlAmount || cleanAmount <= 0) {
      Alert.alert("Atenção", "Digite um valor válido.");
      return;
    }

    setLoading(true);
    try {
      // 3. Chamada para o backend com o payload completo que o Webhook espera
      const response = await api.post("/create-dynamic-checkout", {
        amountBRL: cleanAmount,
        accountId: "acct_1TNmE8LqFArftgqw", // ID da conta conectada (Vendedor)
        walletAddress: USER_WALLET, // Onde o usuário vai receber o ETH
      });

      const data = response.data;

      if (data.url) {
        // Abre o Stripe Checkout
        const result = await WebBrowser.openBrowserAsync(data.url);

        if (result.type === "cancel") {
          Alert.alert("Pagamento", "Checkout cancelado.");
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Erro",
        "Erro ao processar pagamento. Verifique sua conexão.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Comprar ETH</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.currencySymbol}>R$</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0,00"
          placeholderTextColor="#444"
          keyboardType="numeric"
          value={brlAmount}
          onChangeText={setBrlAmount}
          autoFocus
        />

        <View style={styles.conversionRate}>
          <Text style={styles.conversionText}>≈ {ethAmount} ETH</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Cotação Atual:</Text>
          <Text style={styles.infoValue}>
            1 ETH ={" "}
            {ethPrice.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </Text>
        </View>

        <View style={styles.paymentMethod}>
          <Ionicons name="card-outline" size={20} color="#fff" />
          <Text style={styles.paymentMethodText}>Cartão via Stripe</Text>
          <Text style={{ color: "#00FF88", marginLeft: "auto", fontSize: 12 }}>
            Taxa 7% inclusa
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, loading && { opacity: 0.6 }]}
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryButtonText}>Ir para Pagamento</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 25,
    paddingTop: 60,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  closeButton: { backgroundColor: "#222", padding: 8, borderRadius: 20 },
  content: { flex: 1, alignItems: "center", paddingHorizontal: 20 },
  currencySymbol: {
    color: "#888",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
  },
  amountInput: {
    color: "#fff",
    fontSize: 70,
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
  },
  conversionRate: {
    backgroundColor: "#111",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  conversionText: { color: "#00FF88", fontWeight: "600", fontSize: 18 },
  infoBox: { marginTop: 20, alignItems: "center" },
  infoLabel: { color: "#666", fontSize: 12 },
  infoValue: { color: "#aaa", fontSize: 14, fontWeight: "500" },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    width: "100%",
    padding: 20,
    borderRadius: 15,
    marginTop: 40,
  },
  paymentMethodText: { color: "#fff", marginLeft: 10, fontSize: 16 },
  footer: { padding: 20, paddingBottom: 40 },
  primaryButton: {
    backgroundColor: "#fff",
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: { fontSize: 18, fontWeight: "bold", color: "#000" },
});
