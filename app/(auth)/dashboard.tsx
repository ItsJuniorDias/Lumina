import React, { useState, useCallback, useEffect, useMemo } from "react";
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

const ASSET_THEME: {
  [key: string]: { icon: string; color: string; name: string };
} = {
  ETH: { icon: "ethereum", color: "#627EEA", name: "Ethereum" },
  BTC: { icon: "bitcoin", color: "#F7931A", name: "Bitcoin" },
  USDT: { icon: "dollar-sign", color: "#26A17B", name: "Tether USD" },
  BNB: { icon: "coins", color: "#F3BA2F", name: "Binance Coin" },
};

export default function DashboardScreen() {
  const [assets, setAssets] = useState<any[]>([]);
  const [prices, setPrices] = useState<{ [key: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Buscar carteira
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);

      async function fetchBinanceWallet() {
        try {
          const response = await api.get("/wallet-binance");
          const carteiraBinance = response.data.carteira;

          if (carteiraBinance) {
            const symbols = Object.keys(carteiraBinance);

            const rawAssets = symbols.map((symbol) => {
              const theme = ASSET_THEME[symbol] || {
                icon: "coins",
                color: "#888",
                name: symbol,
              };

              return {
                id: symbol,
                symbol,
                name: theme.name,
                amount:
                  parseFloat(carteiraBinance[symbol].available) +
                  parseFloat(carteiraBinance[symbol].onOrder),
                icon: theme.icon,
                color: theme.color,
              };
            });

            setAssets(rawAssets);
          }
        } catch (error: any) {
          console.error("Erro ao buscar carteira:", error.message);
        } finally {
          setIsLoading(false);
        }
      }

      fetchBinanceWallet();
    }, []),
  );

  // 🔹 WebSocket tempo real (COM RECONEXÃO)
  useEffect(() => {
    if (assets.length === 0) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: any;

    const connect = () => {
      const streams = assets
        .map((a) => `${a.symbol.toLowerCase()}brl@ticker`)
        .join("/");

      ws = new WebSocket(
        `wss://stream.binance.com:9443/stream?streams=${streams}`,
      );

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (!msg?.data) return;

        const symbol = msg.data.s.replace("BRL", "");
        const lastPrice = parseFloat(msg.data.c);

        setPrices((prev) => {
          if (prev[symbol] === lastPrice) return prev;

          return {
            ...prev,
            [symbol]: lastPrice,
          };
        });
      };

      ws.onclose = () => {
        console.log("🔌 WS desconectado, reconectando...");
        reconnectTimeout = setTimeout(connect, 2000);
      };

      ws.onerror = (e) => {
        console.log("WebSocket erro:", e);
        ws?.close();
      };
    };

    connect();

    return () => {
      ws?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [assets]);

  // 🔹 Cálculo dinâmico (PERFORMANCE)
  const { totalBrlBalance, displayAssets } = useMemo(() => {
    let total = 0;

    const formatted = assets.map((asset) => {
      const price = prices[asset.symbol] ?? 0;

      const valueBrlRaw = asset.amount * price;
      total += valueBrlRaw;

      return {
        ...asset,
        displayAmount: asset.amount.toFixed(4),
        displayValueBrl: valueBrlRaw.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      };
    });

    return {
      totalBrlBalance: total.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      displayAssets: formatted,
    };
  }, [assets, prices]);

  const goToCharts = (symbol: string) => {
    if (symbol === "ETH") router.push("/ethereum-charts");
  };

  const ActionButton = ({ icon, label, route }: any) => (
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
        <Text style={[styles.tokenValue, { color: "#00ff88" }]}>
          R$ {value}
        </Text>
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
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor:
                      Object.keys(prices).length > 0 ? "#00ff88" : "#F3BA2F",
                  },
                ]}
              />
              <Text style={styles.networkText}>
                {Object.keys(prices).length > 0
                  ? "Live Market"
                  : "Conectando..."}
              </Text>
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
          <ActionButton icon="arrow-up" label="Comprar" route="/buy" />
          <ActionButton icon="arrow-down" label="Vender" route="/sell" />
          <ActionButton
            icon="cash-outline"
            label="Saque Pix"
            route="/saque-pix"
          />
        </View>

        <View style={styles.assetsSection}>
          <Text style={styles.sectionTitle}>Seus Ativos</Text>

          <View style={styles.assetsList}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : displayAssets.length === 0 ? (
              <Text style={{ color: "rgba(255,255,255,0.5)" }}>
                Nenhum ativo encontrado.
              </Text>
            ) : (
              displayAssets.map((asset) => (
                <TokenItem
                  key={asset.id}
                  name={asset.name}
                  symbol={asset.symbol}
                  amount={asset.displayAmount}
                  value={asset.displayValueBrl}
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

  networkBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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

  actionsRow: {
    flexDirection: "row",
    // justifyContent: "space-between",
    marginBottom: 40,
    gap: 24,
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

  actionLabel: {
    color: "#fff",
    fontSize: 13,
    marginTop: 8,
    fontWeight: "500",
  },

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

  tokenValue: { fontSize: 14 },
});
