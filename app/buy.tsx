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
  ScrollView, // <-- Importação do ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { api } from "@/server/api";

export default function BuyScreen() {
  const [brlAmount, setBrlAmount] = useState("");
  const [ethAmount, setEthAmount] = useState("0.00");
  const [ethPrice, setEthPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  const USER_WALLET = "0x4bc1B5e71d30F726eF38e638af080255Fe775fC9";
  const MIN_PURCHASE_BRL = 50.0;

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
        setEthPrice(18000); // Fallback
      }
    }
    fetchPrice();
  }, []);

  useEffect(() => {
    const val = parseFloat(brlAmount.replace(",", "."));
    if (!isNaN(val) && val > 0 && ethPrice > 0) {
      setEthAmount((val / ethPrice).toFixed(6));
    } else {
      setEthAmount("0.00");
    }
  }, [brlAmount, ethPrice]);

  const handleAmountChange = (text) => {
    let cleaned = text.replace(/[^0-9,]/g, "");
    const parts = cleaned.split(",");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) {
      cleaned = `${parts[0]},${parts[1].substring(0, 2)}`;
    }
    setBrlAmount(cleaned);
  };

  const handlePurchase = async () => {
    const cleanAmount = parseFloat(brlAmount.replace(",", "."));

    if (!brlAmount || isNaN(cleanAmount) || cleanAmount <= 0) {
      Alert.alert("Atenção", "Digite um valor válido para compra.");
      return;
    }

    if (cleanAmount < MIN_PURCHASE_BRL) {
      Alert.alert(
        "Atenção",
        `O valor mínimo de compra é de R$ ${MIN_PURCHASE_BRL.toFixed(2).replace(".", ",")}.`,
      );
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/create-dynamic-checkout", {
        amountBRL: cleanAmount,
        accountId: "acct_1TNmZSLorZSSuaDB",
        walletAddress: USER_WALLET,
      });

      const data = response.data;

      if (data.url) {
        const result = await WebBrowser.openBrowserAsync(data.url);
        if (result.type === "cancel") {
          Alert.alert("Pagamento", "A sessão de pagamento foi encerrada.");
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Erro",
        "Não foi possível iniciar o pagamento. Tente novamente mais tarde.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
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

      {/* Alterado para ScrollView para o conteúdo fluir por baixo do botão */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentScroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.currencySymbol}>R$</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0,00"
          placeholderTextColor="#444"
          keyboardType="decimal-pad"
          value={brlAmount}
          onChangeText={handleAmountChange}
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
      </ScrollView>

      {/* Footer flutuante */}
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

  // Novos estilos para o ScrollView
  scrollContainer: {
    flex: 1,
  },
  contentScroll: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 130, // Espaço em branco para o botão flutuante não cobrir o último item
  },

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

  // Footer agora possui Position Absolute
  footer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 20, // Elevação segura dependendo do SO
    left: 20,
    right: 20,
  },
  primaryButton: {
    backgroundColor: "#fff",
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5, // Sombra para o Android destacar o botão por cima
  },
  primaryButtonText: { fontSize: 18, fontWeight: "bold", color: "#000" },
});
