import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator, // <-- Adicionado
} from "react-native";
import { BlurView } from "expo-blur";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import { api } from "@/server/api";

const USER_WALLET = "0x4bc1B5e71d30F726eF38e638af080255Fe775fC9";

export default function DashboardScreen() {
  const [ethBalance, setEthBalance] = useState("0.00");
  const [brlBalance, setBrlBalance] = useState("0,00");
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================
  // INTEGRAÇÃO COM A API USANDO AXIOS
  // ==========================================
  useEffect(() => {
    async function fetchBalance() {
      try {
        const response = await api.get(`/balance/${USER_WALLET}`);

        const data = response.data;

        console.log(data, "DATA");

        if (data.balance) {
          const formattedEth = parseFloat(data.balance);
          setEthBalance(formattedEth.toFixed(4));

          const priceResponse = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=brl",
          );
          const priceData = await priceResponse.json();
          const ethPriceBRL = priceData.ethereum.brl;

          const totalBrl = formattedEth * ethPriceBRL;

          setBrlBalance(
            totalBrl.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          );
        }
      } catch (error) {
        console.error(
          "Erro ao buscar saldo da API:",
          error.response?.data || error.message,
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalance();
  }, []);

  // Formata a carteira para exibir de forma elegante (ex: 0x4bc...75fC)
  const formatAddress = (address: string) => {
    return `${address.slice(0, 5)}...${address.slice(-4)}`;
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

  const TokenItem = ({ name, symbol, amount, value, iconColor }: any) => (
    <View style={styles.tokenRow}>
      <View style={styles.tokenLeft}>
        <View style={[styles.tokenIcon, { backgroundColor: iconColor }]}>
          <FontAwesome5 name="ethereum" size={24} color="#fff" />
        </View>
        <View>
          <Text style={styles.tokenName}>{name}</Text>
          <Text style={styles.tokenSymbol}>{symbol}</Text>
        </View>
      </View>
      <View style={styles.tokenRight}>
        <Text style={styles.tokenAmount}>{amount}</Text>
        <Text style={styles.tokenValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Background com LinearGradient substituindo o fundo sólido */}
      <LinearGradient
        colors={["#2A1B54", "#080414", "#000000"]}
        locations={[0, 0.4, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Opcional: Manter um blob secundário com gradiente para mais complexidade */}
      <LinearGradient colors={["#5856D6", "transparent"]} style={styles.blob} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, Alexandre</Text>
            <View style={styles.networkBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.networkText}>Ethereum</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileCircle}>
            <Ionicons name="person" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Cartão de Saldo Glassmorphism */}
        <View style={styles.cardContainer}>
          <BlurView intensity={70} tint="dark" style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Saldo Total Estimado</Text>

            {/* Renderização Condicional do Loader / Saldo */}
            {isLoading ? (
              <ActivityIndicator
                size="large"
                color="#fff"
                style={{ alignSelf: "flex-start", marginVertical: 10 }}
              />
            ) : (
              <Text style={styles.balanceValue}>R$ {brlBalance}</Text>
            )}

            <View style={styles.cardFooter}>
              <Text style={styles.walletAddress}>
                {formatAddress(USER_WALLET)}
              </Text>
              <Ionicons
                name="copy-outline"
                size={16}
                color="rgba(255,255,255,0.4)"
              />
            </View>
          </BlurView>
        </View>

        {/* Ações Rápidas */}
        <View style={styles.actionsRow}>
          <ActionButton icon="add" label="Receber" route="/receive" />
          <ActionButton icon="arrow-up" label="Enviar" route="/send" />
          <ActionButton icon="swap-horizontal" label="Trocar" route="/swap" />
          <ActionButton icon="card" label="Comprar" route="/buy" />
        </View>

        {/* Lista de Ativos */}
        <View style={styles.assetsSection}>
          <Text style={styles.sectionTitle}>Seus Ativos</Text>
          <View style={styles.assetsList}>
            {/* ETH dinâmico baseado na API */}
            <TokenItem
              name="Ethereum"
              symbol="ETH"
              amount={isLoading ? "Carregando..." : `${ethBalance} ETH`}
              value={isLoading ? "--" : `R$ ${brlBalance}`}
              iconColor="#627EEA"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  blob: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    top: -100,
    right: -100,
    opacity: 0.35,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  greeting: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.6,
  },
  networkBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34C759",
    marginRight: 6,
  },
  networkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContainer: {
    marginBottom: 30,
    borderRadius: 28,
    overflow: "hidden",
  },
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
  actionItem: {
    alignItems: "center",
  },
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
  assetsSection: {
    flex: 1,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },
  assetsList: {
    gap: 20,
  },
  tokenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tokenLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  tokenIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  tokenSymbol: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
  },
  tokenRight: {
    alignItems: "flex-end",
  },
  tokenAmount: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  tokenValue: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
  },
});
