import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import LinearGradient from "react-native-linear-gradient";
import { api } from "@/server/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// --- CONFIGURAÇÃO DE DESIGN (CYBER DESIGN SYSTEM) ---
const COLORS = {
  CYAN: "#00FFFF",
  MAGENTA: "#FF00FF",
  BLACK: "#050509",
  GREY: "#101018",
  ERROR: "#FF4545",
  TEXT_MUTED: "rgba(255, 255, 255, 0.4)",
};

// --- COMPONENTE DE BORDA NEON ---
const CyberBorder = ({ children, color = COLORS.CYAN, style }: any) => (
  <View style={[styles.borderWrapper, style]}>
    <LinearGradient
      colors={["transparent", color, "transparent"]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.neonLine}
    />
    {children}
    <LinearGradient
      colors={["transparent", color, "transparent"]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.neonLine}
    />
  </View>
);

export default function SellScreen() {
  const queryClient = useQueryClient();

  // 1. ESTADO E CONSTANTES
  const BALANCE_ETH = 1.45; // Em produção, virá do seu banco/contexto
  const PLATFORM_FEE_PERCENTAGE = 0.02; // 2% da plataforma

  const [amount, setAmount] = useState("");

  // 👇 2. BUSCA DE PREÇO COM TANSTACK QUERY
  const { data: ethRateBRL = 0, isLoading: loadingRate } = useQuery({
    queryKey: ["eth-price-brl"],
    queryFn: async () => {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=brl",
      );
      const data = await response.json();
      return data.ethereum.brl;
    },
    refetchInterval: 15000, // Atualiza sozinho a cada 15s
  });

  // 3. LÓGICA DE VALIDAÇÃO E TAXAS
  const numericAmount = parseFloat(amount.replace(",", ".")) || 0;
  const isOverBalance = numericAmount > BALANCE_ETH;
  const isInvalid = !amount || numericAmount <= 0 || isOverBalance;

  // Calcula a taxa e o montante real a ser liquidado em BRL
  const feeAmountETH = numericAmount * PLATFORM_FEE_PERCENTAGE;
  const sellableAmountETH = numericAmount - feeAmountETH;

  // 👇 4. MUTAÇÃO PARA LIQUIDAÇÃO
  const sellMutation = useMutation({
    mutationFn: async (amountInETH: number) => {
      const response = await api.post("/sell-eth", { amountInETH });

      if (!response.data.success) {
        throw new Error(response.data.message || "Falha na execução.");
      }
      return response.data.receipt;
    },
    onSuccess: async (receipt) => {
      // INVALIDE O CACHE DA DASHBOARD AQUI
      queryClient.invalidateQueries({ queryKey: ["wallet-binance"] });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      let successMessage = "Liquidação executada com sucesso.";
      if (receipt) {
        successMessage =
          `Quantia Retirada: ${receipt.requestedAmountETH} ETH\n` +
          `Taxa do Protocolo: ${receipt.platformFeeETH.toFixed(4)} ETH\n` +
          `Liquidado no Mercado: ${receipt.actualExecutedOnBinanceETH} ETH`;
      }

      Alert.alert("PROTOCOLO CONCLUÍDO", successMessage, [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: async (error: any) => {
      console.error(error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "FALHA NO PROTOCOLO",
        error.message || "Não foi possível liquidar o ativo.",
      );
    },
  });

  // 5. HANDLERS
  const handleMax = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAmount(BALANCE_ETH.toString());
  };

  const handleExecuteSell = () => {
    if (isInvalid) return;
    sellMutation.mutate(numericAmount);
  };

  // 6. CÁLCULO DE RECEBIMENTO (Baseado no valor com taxa descontada)
  const receiveAmountBRL =
    sellableAmountETH > 0 && ethRateBRL > 0
      ? (sellableAmountETH * ethRateBRL).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0,00";

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>LIQUIDAR ATIVO</Text>
              <Text style={styles.subtitle}>PROTOCOLO DE VENDA V1.0</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
              disabled={sellMutation.isPending}
            >
              <Ionicons name="close" size={24} color={COLORS.CYAN} />
            </TouchableOpacity>
          </View>

          {/* CONTEÚDO PRINCIPAL */}
          <View style={styles.content}>
            {/* ÁREA DE INPUT */}
            <View style={styles.inputContainer}>
              <Text style={styles.sectionLabel}>QUANTIA PARA VENDER</Text>
              <View style={styles.amountInputRow}>
                <TextInput
                  style={[
                    styles.amountInput,
                    isOverBalance && { color: COLORS.ERROR },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor="rgba(0,255,255,0.1)"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  selectionColor={COLORS.CYAN}
                  editable={!sellMutation.isPending}
                />
                <View
                  style={[
                    styles.assetBadge,
                    isOverBalance && { borderColor: COLORS.ERROR },
                  ]}
                >
                  <Text
                    style={[
                      styles.assetName,
                      isOverBalance && { color: COLORS.ERROR },
                    ]}
                  >
                    ETH
                  </Text>
                </View>
              </View>

              {/* SALDO DINÂMICO */}
              <View style={styles.balanceRow}>
                <MaterialCommunityIcons
                  name="database-outline"
                  size={14}
                  color={isOverBalance ? COLORS.ERROR : COLORS.TEXT_MUTED}
                />
                <Text
                  style={[
                    styles.balanceText,
                    isOverBalance && {
                      color: COLORS.ERROR,
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {isOverBalance
                    ? "SALDO INSUFICIENTE"
                    : `DISPONÍVEL: ${BALANCE_ETH} ETH`}
                </Text>
                <TouchableOpacity
                  style={styles.maxButton}
                  onPress={handleMax}
                  disabled={sellMutation.isPending}
                >
                  <Text style={styles.maxButtonText}>MÁX</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* CARD DE CONVERSÃO (NEXUS) */}
            <CyberBorder
              color={isOverBalance ? COLORS.ERROR : COLORS.MAGENTA}
              style={styles.nexusCardWrapper}
            >
              <View style={styles.nexusCard}>
                <View style={styles.nexusRow}>
                  <View style={styles.nexusModule}>
                    <Text style={styles.nexusLabel}>ORIGEM</Text>
                    <Text style={styles.nexusValue}>
                      {numericAmount.toFixed(4)} ETH
                    </Text>
                  </View>

                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={COLORS.CYAN}
                    style={styles.nexusArrow}
                  />

                  <View
                    style={[styles.nexusModule, { alignItems: "flex-end" }]}
                  >
                    <Text style={styles.nexusLabel}>DESTINO ESTIMADO</Text>
                    <Text style={[styles.nexusValue, { color: COLORS.CYAN }]}>
                      R$ {receiveAmountBRL}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* INFO DE TAXAS TRANSPARENTES */}
                <View style={styles.feeInfoContainer}>
                  <Text style={styles.feeLabel}>TAXA DO PROTOCOLO (2%):</Text>
                  <Text style={styles.feeValue}>
                    - {feeAmountETH > 0 ? feeAmountETH.toFixed(4) : "0.0000"}{" "}
                    ETH
                  </Text>
                </View>

                <View style={styles.rateInfo}>
                  {loadingRate ? (
                    <ActivityIndicator size="small" color={COLORS.CYAN} />
                  ) : (
                    <Text style={styles.rateText}>
                      NETWORK_RATE: 1 ETH = R${" "}
                      {ethRateBRL.toLocaleString("pt-BR")}
                    </Text>
                  )}
                </View>
              </View>
            </CyberBorder>
          </View>

          {/* FOOTER - BOTÃO DE AÇÃO */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isInvalid || sellMutation.isPending}
              onPress={handleExecuteSell}
            >
              <LinearGradient
                colors={
                  isInvalid || sellMutation.isPending
                    ? [COLORS.GREY, COLORS.GREY]
                    : [COLORS.MAGENTA, "#800080"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                {sellMutation.isPending ? (
                  <ActivityIndicator color={COLORS.CYAN} />
                ) : (
                  <Text
                    style={[
                      styles.primaryButtonText,
                      isInvalid && { opacity: 0.5 },
                    ]}
                  >
                    {isOverBalance
                      ? "SALDO INSUFICIENTE"
                      : "EXECUTAR LIQUIDAÇÃO"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BLACK },
  inner: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: "rgba(0,255,255,0.1)",
  },
  title: {
    color: COLORS.CYAN,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
    textShadowColor: COLORS.CYAN,
    textShadowRadius: 10,
  },
  subtitle: { color: COLORS.TEXT_MUTED, fontSize: 10, marginTop: 4 },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(0,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.2)",
  },

  content: { flex: 1, paddingHorizontal: 24, paddingTop: 30 },

  inputContainer: { marginBottom: 30 },
  sectionLabel: {
    color: COLORS.TEXT_MUTED,
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amountInput: { color: "#FFF", fontSize: 48, fontWeight: "800", flex: 1 },
  assetBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.GREY,
    borderWidth: 1,
    borderColor: COLORS.CYAN,
    borderRadius: 4,
  },
  assetName: { color: COLORS.CYAN, fontWeight: "800", fontSize: 14 },

  balanceRow: { flexDirection: "row", alignItems: "center", marginTop: 15 },
  balanceText: { color: COLORS.TEXT_MUTED, fontSize: 13, marginLeft: 6 },
  maxButton: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.MAGENTA,
    borderRadius: 4,
  },
  maxButtonText: { color: COLORS.MAGENTA, fontSize: 11, fontWeight: "bold" },

  neonLine: { height: 1, width: "100%" },
  nexusCardWrapper: { marginTop: 10 },
  nexusCard: { backgroundColor: COLORS.GREY, padding: 20 },
  nexusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nexusModule: { flex: 1 },
  nexusLabel: { color: COLORS.TEXT_MUTED, fontSize: 10, marginBottom: 5 },
  nexusValue: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  nexusArrow: { opacity: 0.5 },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: 15,
  },

  feeInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  feeLabel: { color: COLORS.MAGENTA, fontSize: 10, fontWeight: "bold" },
  feeValue: { color: COLORS.MAGENTA, fontSize: 12, fontWeight: "bold" },

  rateInfo: { alignItems: "center" },
  rateText: {
    color: COLORS.TEXT_MUTED,
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },

  footer: { padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24 },
  primaryButton: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  primaryButtonText: { color: "#fff", fontWeight: "900", letterSpacing: 1.5 },
  borderWrapper: { width: "100%" },
});
