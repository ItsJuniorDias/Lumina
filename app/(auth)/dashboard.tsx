import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { api } from "@/server/api";
import { useQuery } from "@tanstack/react-query";

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import InteractiveBalanceCard from "@/components/card";
import MarketInsightCard from "@/components/MarketInsightCard";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Permissão para push negada!");
      return;
    }
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } catch (error) {
      console.error("Erro ao gerar token de push:", error);
    }
  }
  return token;
}

const ASSET_THEME: {
  [key: string]: { icon: string; color: string; name: string };
} = {
  ETH: { icon: "ethereum", color: "#627EEA", name: "Ethereum" },
  BTC: { icon: "bitcoin", color: "#F7931A", name: "Bitcoin" },
  USDT: { icon: "dollar-sign", color: "#26A17B", name: "Tether USD" },
  BNB: { icon: "coins", color: "#F3BA2F", name: "Binance Coin" },
};

// 👇 Componente de Skeleton Animado
const SkeletonTokenItem = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.tokenRow, { opacity }]}>
      <View style={styles.tokenLeft}>
        <View
          style={[
            styles.tokenIcon,
            { backgroundColor: "rgba(255,255,255,0.1)" },
          ]}
        />
        <View>
          <View
            style={[
              styles.skeletonBlock,
              { width: 80, height: 16, marginBottom: 6 },
            ]}
          />
          <View style={[styles.skeletonBlock, { width: 40, height: 12 }]} />
        </View>
      </View>
      <View style={styles.tokenRight}>
        <View
          style={[
            styles.skeletonBlock,
            { width: 60, height: 16, marginBottom: 6 },
          ]}
        />
        <View style={[styles.skeletonBlock, { width: 50, height: 12 }]} />
      </View>
    </Animated.View>
  );
};

export default function DashboardScreen() {
  const [prices, setPrices] = useState<{ [key: string]: number }>({});

  const latestData = useRef({ displayAssets: [] as any[], gasPrice: "N/A" });
  const [aiSnapshot, setAiSnapshot] = useState<{
    topCoins: any[];
    gasPrice: string;
  } | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  const { data: assets = [], isLoading: isLoadingAssets } = useQuery({
    queryKey: ["wallet-binance"],
    queryFn: async () => {
      const response = await api.get("/wallet-binance");
      const carteiraBinance = response.data.carteira;

      if (!carteiraBinance) return [];

      const symbols = Object.keys(carteiraBinance);
      return symbols.map((symbol) => {
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
    },
  });

  const { data: gasPrice = "N/A" } = useQuery({
    queryKey: ["gas-price"],
    queryFn: async () => {
      const apiKey = "QHACMA9TI95HFJ7V69FV43ZP7MKFPRXMGJ";
      const response = await fetch(
        `https://api.etherscan.io/v2/api?chainid=1&module=gastracker&action=gasoracle&apikey=${apiKey}`,
      );
      const data = await response.json();

      if (data.status === "1") {
        return data.result.ProposeGasPrice;
      }
      throw new Error(`Erro do Etherscan: ${data.result}`);
    },
    refetchInterval: 30000,
  });

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
          return { ...prev, [symbol]: lastPrice };
        });
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 2000);
      };

      ws.onerror = () => ws?.close();
    };

    connect();
    return () => {
      ws?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [assets]);

  // 👇 Regra mais flexível: Sai do loading assim que a API responder E o WebSocket der o primeiro sinal de vida
  const isCalculatingBrl = useMemo(() => {
    if (isLoadingAssets) return true; // Espera a API da Binance
    if (assets.length === 0) return false; // Carteira vazia, mostra a tela direto

    // Se ainda não recebemos NENHUM preço do WebSocket, continua no loading.
    // Assim que a primeira moeda piscar, a interface é liberada.
    return Object.keys(prices).length === 0;
  }, [isLoadingAssets, assets, prices]);

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

  useEffect(() => {
    latestData.current = { displayAssets, gasPrice };
  }, [displayAssets, gasPrice]);

  useEffect(() => {
    if (assets.length === 0) return;

    const updateSnapshot = () => {
      const { displayAssets: currentAssets, gasPrice: currentGas } =
        latestData.current;

      if (currentAssets.length === 0) return;

      const topCoinsData = currentAssets.map((a) => ({
        ativo: a.symbol,
        quantidade: a.displayAmount,
        valorAtualBRL: a.displayValueBrl,
      }));

      setAiSnapshot({ topCoins: topCoinsData, gasPrice: currentGas });
    };

    updateSnapshot();
    const interval = setInterval(updateSnapshot, 30000);

    return () => clearInterval(interval);
  }, [assets.length]);

  const goToCharts = (symbol: string) => {
    if (symbol === "ETH") router.push("/ethereum-charts");
  };

  const ActionButton = ({ icon, label, route, CustomIcon }: any) => (
    <TouchableOpacity
      style={styles.actionItem}
      activeOpacity={0.7}
      onPress={() => router.push(route)}
    >
      <BlurView intensity={30} tint="light" style={styles.actionIconCircle}>
        {CustomIcon ? (
          <CustomIcon />
        ) : (
          <Ionicons name={icon} size={24} color="#fff" />
        )}
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
                      !isCalculatingBrl && Object.keys(prices).length > 0
                        ? "#00ff88"
                        : "#F3BA2F",
                  },
                ]}
              />
              <Text style={styles.networkText}>
                {!isCalculatingBrl && Object.keys(prices).length > 0
                  ? "Live Market"
                  : "Sincronizando Preços..."}
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

        {/* Passamos isCalculatingBrl no lugar de isLoadingAssets */}
        <InteractiveBalanceCard
          balance={totalBrlBalance}
          isLoading={isCalculatingBrl}
        />

        <View style={styles.actionsRow}>
          <ActionButton icon="arrow-up" label="Comprar" route="/buy" />
          <ActionButton icon="arrow-down" label="Vender" route="/sell" />
          <ActionButton
            icon="cash-outline"
            label="Saque Pix"
            route="/saque-pix"
          />
          <ActionButton
            label="Mentor IA"
            route="/mentor"
            CustomIcon={() => (
              <MaterialCommunityIcons
                name="robot-outline"
                size={24}
                color="#00E5FF"
              />
            )}
          />
        </View>

        {!isCalculatingBrl && aiSnapshot && (
          <View style={{ marginBottom: 30 }}>
            <MarketInsightCard
              topCoins={aiSnapshot.topCoins}
              gasPrice={aiSnapshot.gasPrice}
            />
          </View>
        )}

        <View style={styles.assetsSection}>
          <Text style={styles.sectionTitle}>Seus Ativos</Text>
          <View style={styles.assetsList}>
            {isCalculatingBrl ? (
              <>
                <SkeletonTokenItem />
                <SkeletonTokenItem />
                <SkeletonTokenItem />
              </>
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
  networkBadge: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
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
    justifyContent: "space-between",
    marginBottom: 30,
    gap: 10,
  },
  actionItem: { alignItems: "center", flex: 1 },
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
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
    textAlign: "center",
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
  skeletonBlock: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 6 }, // Estilo pro skeleton
});
