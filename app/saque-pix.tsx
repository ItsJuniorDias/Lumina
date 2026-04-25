// screens/WithdrawScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { ethers } from "ethers";
import { API_BASE_URL } from "@/server/api";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function WithdrawScreen() {
  const queryClient = useQueryClient();

  const [amountBrl, setAmountBrl] = useState("");
  const [pixKey, setPixKey] = useState("");

  const withdrawMutation = useMutation({
    mutationFn: async (numericAmount: number) => {
      // 1. Autorização Biométrica
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "AUTORIZAÇÃO BIOMÉTRICA REQUERIDA",
        fallbackLabel: "INSERIR CÓDIGO DE ACESSO",
      });

      if (!authResult.success) {
        throw new Error(
          "Acesso negado. A assinatura biométrica é obrigatória para a extração de fundos.",
        );
      }

      console.log("[SISTEMA] Sincronizando cotação USDT/BRL atual...");

      // 2. Obter cotação atual do USDT em BRL (usando a API pública da Binance)
      const binanceRes = await fetch(
        "https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL",
      );
      const binanceData = await binanceRes.json();
      const currentUsdtPrice = parseFloat(binanceData.price);

      const usdtAmountToSend = (numericAmount / currentUsdtPrice).toFixed(6);

      console.log(
        `[SISTEMA] Câmbio: R$ ${numericAmount} equivale a ~${usdtAmountToSend} USDT`,
      );

      // 3. Conectar à Blockchain
      const provider = new ethers.JsonRpcProvider(
        "https://eth-mainnet.g.alchemy.com/v2/T3-iK_3wijCdj7_O79nij",
      );

      const userPrivateKey = process.env.EXPO_PUBLIC_API_SECRET;

      if (!userPrivateKey) {
        throw new Error("Chave privada não encontrada no ambiente.");
      }

      const wallet = new ethers.Wallet(userPrivateKey, provider);

      console.log(
        "[SISTEMA] Inicializando uplink com contrato inteligente ERC-20...",
      );

      // 4. Instanciar o contrato do USDT e enviar os fundos
      const HOT_WALLET_ADDRESS = "0xa0860442611869213eEDcB1A8b855C644E094c71";
      const USDT_CONTRACT_ADDRESS =
        "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Contrato oficial do USDT na Mainnet

      const erc20Abi = [
        "function transfer(address to, uint256 amount) returns (bool)",
      ];

      const usdtContract = new ethers.Contract(
        USDT_CONTRACT_ADDRESS,
        erc20Abi,
        wallet,
      );

      const parsedAmount = ethers.parseUnits(usdtAmountToSend.toString(), 6);
      const tx = await usdtContract.transfer(HOT_WALLET_ADDRESS, parsedAmount);

      await tx.wait();

      console.log(
        `[SISTEMA] Transação ERC-20 validada na rede. TX_HASH: ${tx.hash}`,
      );

      // 5. Disparar Pix pelo Servidor
      const response = await fetch(`${API_BASE_URL}/withdraw/pix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionHash: tx.hash,
          pixKey: pixKey,
        }),
      });

      const serverData = await response.json();

      if (!response.ok || !serverData.success) {
        throw new Error(serverData.error || "Falha desconhecida no servidor.");
      }

      return { serverData, numericAmount };
    },
    onSuccess: ({ serverData, numericAmount }) => {
      // 👇 Invalida o cache para a Dashboard ser atualizada no background
      queryClient.invalidateQueries({ queryKey: ["wallet-binance"] });

      Alert.alert(
        "TRANSFERÊNCIA CONCLUÍDA",
        `Valor: R$ ${
          serverData.amount || numericAmount.toFixed(2)
        }\nAtivos redirecionados para: ${pixKey}`,
      );

      setAmountBrl("");
      setPixKey("");
    },
    onError: (error: any) => {
      console.error("[ERRO_CRÍTICO] Falha no nó de processamento", error);
      Alert.alert(
        "FALHA NO SISTEMA",
        error.message ||
          "Anomalia detectada ao processar o contrato inteligente ou comunicar com o servidor.",
      );
    },
  });

  function handlePixWithdrawal() {
    const numericAmount = parseFloat(amountBrl.replace(",", "."));

    if (!numericAmount || numericAmount <= 0) {
      Alert.alert(
        "FALHA DE PARÂMETRO",
        "Insira uma quantidade válida em BRL para extração.",
      );
      return;
    }

    if (!pixKey.trim()) {
      Alert.alert("FALHA DE PARÂMETRO", "A chave alvo Pix é obrigatória.");
      return;
    }

    // Dispara a mutação do TanStack
    withdrawMutation.mutate(numericAmount);
  }

  return (
    <View style={styles.container}>
      <View style={styles.hudHeader}>
        <View style={{ gap: 8 }}>
          <Text style={styles.hudText}>SEC_LINK: ESTABELECIDO</Text>
          <Text style={styles.hudText}>NODE_LATENCY: 12ms</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
          disabled={withdrawMutation.isPending}
        >
          <Ionicons name="close" size={24} color="#888" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>
        PROTOCOLO DE EXTRAÇÃO // <Text style={styles.highlight}>PIX</Text>
      </Text>

      <View style={styles.inputWrapper}>
        <Text style={styles.label}>[ PARÂMETRO 01: QUANTIDADE EM BRL ]</Text>
        <TextInput
          placeholder="0.00"
          placeholderTextColor="rgba(0, 240, 255, 0.3)"
          value={amountBrl}
          onChangeText={setAmountBrl}
          keyboardType="numeric"
          style={styles.input}
          selectionColor="#00f0ff"
          editable={!withdrawMutation.isPending}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.label}>[ PARÂMETRO 02: CHAVE ALVO PIX ]</Text>
        <TextInput
          placeholder="INSERIR DADOS DE ROTA"
          placeholderTextColor="rgba(0, 240, 255, 0.3)"
          value={pixKey}
          onChangeText={setPixKey}
          style={styles.input}
          selectionColor="#00f0ff"
          editable={!withdrawMutation.isPending}
        />
      </View>

      <TouchableOpacity
        onPress={handlePixWithdrawal}
        disabled={withdrawMutation.isPending}
        activeOpacity={0.7}
        style={[
          styles.button,
          withdrawMutation.isPending && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.buttonText}>
          {withdrawMutation.isPending
            ? "SINCRONIZANDO COM A REDE..."
            : "AUTORIZAR SAQUE [FACE_ID]"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        STATUS:{" "}
        {withdrawMutation.isPending
          ? "PROCESSANDO_CONTRATO"
          : "AGUARDANDO_COMANDO"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05050A",
    padding: 24,
    justifyContent: "center",
  },

  closeButton: {
    width: 44,
    height: 44,
    backgroundColor: "#111",
    padding: 8,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  hudHeader: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",

    top: 50,
    left: 24,
    borderLeftWidth: 2,
    borderColor: "#00f0ff",
    paddingLeft: 10,
  },
  hudText: {
    color: "#00f0ff",
    fontSize: 10,
    fontFamily: "Courier",
    letterSpacing: 1.5,
    opacity: 0.7,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 40,
    fontFamily: "Courier",
  },
  highlight: {
    color: "#ff0055",
    textShadowColor: "rgba(255, 0, 85, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  label: {
    color: "rgba(0, 240, 255, 0.8)",
    fontSize: 12,
    marginBottom: 8,
    fontFamily: "Courier",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "rgba(0, 240, 255, 0.03)",
    color: "#00f0ff",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.4)",
    borderRadius: 4,
    fontSize: 18,
    fontFamily: "Courier",
  },
  button: {
    marginTop: 20,
    backgroundColor: "rgba(255, 0, 85, 0.1)",
    borderWidth: 1,
    borderColor: "#ff0055",
    padding: 18,
    borderRadius: 4,
    alignItems: "center",
    shadowColor: "#ff0055",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    borderColor: "#444",
    backgroundColor: "rgba(68, 68, 68, 0.2)",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#ff0055",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 2,
    fontFamily: "Courier",
    textShadowColor: "rgba(255, 0, 85, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  footerText: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 10,
    fontFamily: "Courier",
    letterSpacing: 2,
  },
});
