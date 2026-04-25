import React, { useEffect, useState, useRef, memo } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { BlurView } from "expo-blur";
import { fetchMarketInsight } from "../server/gemini-api";

const MarketInsightCard = ({ topCoins, gasPrice }) => {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const latestProps = useRef({ topCoins, gasPrice });

  useEffect(() => {
    latestProps.current = { topCoins, gasPrice };
  }, [topCoins, gasPrice]);

  useEffect(() => {
    let isMounted = true;

    const getInsight = async () => {
      try {
        setRefreshing(true);

        const { topCoins: currentCoins, gasPrice: currentGas } =
          latestProps.current;

        const result = await fetchMarketInsight(currentCoins, currentGas);

        if (result.success && isMounted) {
          setInsight({ ...result.data });
        }
      } catch (error) {
        console.error("Erro ao buscar insight:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    // Primeira execução ao montar o componente
    getInsight();

    // Atualização estrita a cada 30 segundos (30000 ms)
    const intervalId = setInterval(() => {
      getInsight();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []); // Dependência vazia garante que o timer só seja criado uma vez

  if (loading && !insight) {
    return (
      <BlurView intensity={40} tint="dark" style={[styles.card, styles.center]}>
        <ActivityIndicator color="#8A2BE2" />
      </BlurView>
    );
  }

  if (!insight) return null;

  const getStatusColor = () => {
    if (insight.status_geral === "Bullish") return "#00FF66";
    if (insight.status_geral === "Bearish") return "#FF0055";
    return "#00E5FF";
  };

  return (
    <BlurView intensity={50} tint="dark" style={styles.card}>
      <View style={styles.header}>
        <View style={{ gap: 4 }}>
          <Text style={styles.title}>Exegese de Mercado</Text>

          {refreshing && <Text style={styles.refreshText}>Atualizando...</Text>}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={[styles.badge, { borderColor: getStatusColor() }]}>
            <Text style={[styles.badgeText, { color: getStatusColor() }]}>
              {insight.status_geral}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.analysis}>{insight.analise_curta}</Text>

      <View style={styles.gasDivider} />
      <Text style={styles.gasAlert}>⛽ {insight.alerta_gas}</Text>
    </BlurView>
  );
};

// Envolvendo com React.memo para evitar re-renders causados pelo pai
export default memo(MarketInsightCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginVertical: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(20, 20, 25, 0.4)",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    height: 140,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  analysis: {
    color: "#E0E0E0",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  gasDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 12,
  },
  gasAlert: {
    color: "#A0A0B0",
    fontSize: 13,
    fontWeight: "500",
  },
  refreshText: {
    color: "#888",
    fontSize: 11,
  },
});
