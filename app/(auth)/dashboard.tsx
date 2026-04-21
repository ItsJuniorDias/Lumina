import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { api } from "@/server/api";
import InteractiveBalanceCard from "@/components/card";

// 1. Mapeamento para buscar preços no CoinGecko
// A Binance retorna siglas (ETH, BTC). O CoinGecko exige IDs (ethereum, bitcoin).
const COINGECKO_IDS: { [key: string]: string } = {
  ETH: "ethereum",
  BTC: "bitcoin",
  USDT: "tether",
  BNB: "binancecoin",
};

// 2. Mapeamento visual de Ícones e Cores
const ASSET_THEME: {
  [key: string]: { icon: string; color: string; name: string };
} = {
  ETH: { icon: "ethereum", color: "#627EEA", name: "Ethereum" },
  BTC: { icon: "bitcoin", color: "#F7931A", name: "Bitcoin" },
  USDT: { icon: "dollar-sign", color: "#26A17B", name: "Tether USD" },
  BNB: { icon: "coins", color: "#F3BA2F", name: "Binance Coin" },
};

export default function DashboardScreen() {
  // Agora guardamos uma lista de ativos, e não apenas o ETH
  const [assets, setAssets] = useState<any[]>([]);
  const [totalBrlBalance, setTotalBrlBalance] = useState("0,00");
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      // Força o estado de loading ao voltar para a tela
      setIsLoading(true);

      async function fetchBinanceWallet() {
        try {
          // Busca os saldos na sua nova rota do backend
          const response = await api.get("/wallet-binance");
          const carteiraBinance = response.data.carteira;

          if (carteiraBinance) {
            const symbols = Object.keys(carteiraBinance);
            let rawAssets = [];
            let totalBrlCalculated = 0;

            // Filtra quais IDs precisamos buscar no CoinGecko
            const idsToFetch = symbols
              .map((sym) => COINGECKO_IDS[sym])
              .filter(Boolean); // Remove os undefined

            let prices: any = {};
            if (idsToFetch.length > 0) {
              const priceResponse = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${idsToFetch.join(
                  ",",
                )}&vs_currencies=brl`,
              );
              prices = await priceResponse.json();
            }

            // Processa cada moeda retornada pela Binance
            for (const symbol of symbols) {
              const available = parseFloat(carteiraBinance[symbol].available);
              const onOrder = parseFloat(carteiraBinance[symbol].onOrder);
              const totalAmount = available + onOrder;

              const cgId = COINGECKO_IDS[symbol];
              const priceInBrl = cgId && prices[cgId] ? prices[cgId].brl : 0;
              const valueBrl = totalAmount * priceInBrl;

              totalBrlCalculated += valueBrl;

              // Busca tema visual, ou usa um padrão genérico
              const theme = ASSET_THEME[symbol] || {
                icon: "coins",
                color: "#888",
                name: symbol,
              };

              rawAssets.push({
                id: symbol,
                symbol: symbol,
                name: theme.name,
                amount: totalAmount.toFixed(4),
                valueBrl: valueBrl.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
                icon: theme.icon,
                color: theme.color,
              });
            }

            setAssets(rawAssets);
            setTotalBrlBalance(
              totalBrlCalculated.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            );
          }
        } catch (error: any) {
          console.error(
            "Erro ao buscar saldo da Binance:",
            error.response?.data || error.message,
          );
        } finally {
          setIsLoading(false);
        }
      }

      fetchBinanceWallet();
    }, []),
  );

  const goToCharts = (symbol: string) => {
    // Exemplo de como rotear dinamicamente dependendo da moeda clicada
    if (symbol === "ETH") router.push("/ethereum-charts");
    // if (symbol === 'BTC') router.push("/bitcoin-charts");
  };

  const ActionButton = ({
    icon,
    label,
    route,
  }: {
    icon: any;
    label: string;
    route: any;
  }) => (
    <TouchableOpacity
      style={styles.actionItem}
      activeOpacity={0.7}
      onPress={() => router.push(route)}
    >
      <BlurView intensity={30} tint="light" style={styles.actionIconCircle}>
        <Ionicons name={icon} size={24} color="#fff" />
      </BlurView>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const TokenItem = ({
    name,
    symbol,
    amount,
    value,
    iconColor,
    iconName,
    onPress,
  }: any) => (
    <TouchableOpacity
      style={styles.tokenRow}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.tokenLeft}>
        <View style={[styles.tokenIcon, { backgroundColor: iconColor }]}>
          <FontAwesome5 name={iconName} size={20} color="#fff" />
        </View>
        <View>
          <Text style={styles.tokenName}>{name}</Text>
          <Text style={styles.tokenSymbol}>{symbol}</Text>
        </View>
      </View>
      <View style={styles.tokenRight}>
        <Text style={styles.tokenAmount}>{amount}</Text>
        <Text style={styles.tokenValue}>R$ {value}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#2A1B54", "#080414", "#000000"]}
        locations={[0, 0.4, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <LinearGradient colors={["#5856D6", "transparent"]} style={styles.blob} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, Alexandre</Text>
            <View style={styles.networkBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.networkText}>Binance Connected</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/profile")}
            style={styles.profileCircle}
          >
            <Ionicons name="person" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <InteractiveBalanceCard
          balance={totalBrlBalance}
          isLoading={isLoading}
        />

        <View style={styles.actionsRow}>
          {/* <ActionButton icon="add" label="Receber" route="/receive" />
          <ActionButton icon="arrow-up" label="Enviar" route="/send" />
          <ActionButton icon="swap-horizontal" label="Trocar" route="/swap" /> */}
          <ActionButton icon="card" label="Comprar" route="/buy" />
        </View>

        <View style={styles.assetsSection}>
          <Text style={styles.sectionTitle}>Seus Ativos</Text>
          <View style={styles.assetsList}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : assets.length === 0 ? (
              <Text style={{ color: "rgba(255,255,255,0.5)" }}>
                Nenhum ativo encontrado.
              </Text>
            ) : (
              // 🔥 O .map() gera a lista dinamicamente baseada na resposta da Binance
              assets.map((asset) => (
                <TokenItem
                  key={asset.id}
                  name={asset.name}
                  symbol={asset.symbol}
                  amount={asset.amount}
                  value={asset.valueBrl}
                  iconColor={asset.color}
                  iconName={asset.icon}
                  onPress={() => goToCharts(asset.symbol)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  blob: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    top: -100,
    right: -100,
    opacity: 0.35,
  },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  greeting: { color: "#fff", fontSize: 16, opacity: 0.6 },
  networkBadge: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F3BA2F", // Mudei para amarelo Binance
    marginRight: 6,
  },
  networkText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContainer: { marginBottom: 30, borderRadius: 28, overflow: "hidden" },
  balanceCard: {
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    marginBottom: 8,
  },
  balanceValue: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  walletAddress: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    marginRight: 8,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  actionItem: { alignItems: "center" },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  actionLabel: { color: "#fff", fontSize: 13, marginTop: 8, fontWeight: "500" },
  assetsSection: { flex: 1 },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },
  assetsList: { gap: 20 },
  tokenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tokenLeft: { flexDirection: "row", alignItems: "center" },
  tokenIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenName: { color: "#fff", fontSize: 17, fontWeight: "600" },
  tokenSymbol: { color: "rgba(255,255,255,0.4)", fontSize: 14 },
  tokenRight: { alignItems: "flex-end" },
  tokenAmount: { color: "#fff", fontSize: 17, fontWeight: "600" },
  tokenValue: { color: "rgba(255,255,255,0.4)", fontSize: 14 },
});
