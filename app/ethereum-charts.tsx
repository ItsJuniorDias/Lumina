import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-wagmi-charts";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/server/api";
import { runOnJS } from "react-native-reanimated";

export default function EthereumChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [scrubbedPrice, setScrubbedPrice] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  useEffect(() => {
    fetchCryptoData();
    const cleanupWs = setupWebSocket();
    return cleanupWs;
  }, []);

  // WEBSOCKET: Escutando o par ETH/USDT (Dólar)
  const setupWebSocket = () => {
    const ws = new WebSocket(
      "wss://stream.binance.com:9443/ws/ethusdt@miniTicker",
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const price = parseFloat(data.c);
      setLivePrice(price);
    };

    ws.onerror = (error) => {
      console.error("Erro no WebSocket:", error);
    };

    return () => {
      ws.close();
    };
  };

  // Garante que a tela não fique vazia enquanto o WS conecta
  useEffect(() => {
    if (chartData.length > 0) {
      const last = chartData[chartData.length - 1];
      if (!isNaN(last.value)) {
        setLivePrice((prev) => prev ?? last.value);
      }
    }
  }, [chartData]);

  const fetchCryptoData = async () => {
    try {
      const response = await api.get("/ethereum-chart?days=7");
      const result = await response.data;

      const formattedData = result.data
        .map((item: any) => ({
          timestamp: item.timestamp,
          value: Number(item.price), // Certifique-se de que a API retorne em Dólar
        }))
        .sort((a: any, b: any) => a.timestamp - b.timestamp);

      setChartData(formattedData);
    } catch (error) {
      console.error("Erro ao buscar dados históricos:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateScrubbedPrice = (val: number) => {
    if (!isScrubbing) setIsScrubbing(true);
    setScrubbedPrice(val);
  };

  // Função auxiliar para formatar os campos de texto principais em Dólar
  const formatUSD = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#627EEA" />
        <Text style={styles.loadingText}>Carregando Ethereum...</Text>
      </View>
    );
  }

  if (!chartData.length) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>
          Não foi possível carregar o gráfico.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#111", "#000"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#627EEA" />
        </TouchableOpacity>
      </View>

      <LineChart.Provider data={chartData}>
        <View style={styles.priceContainer}>
          <View style={styles.titleRow}>
            <View style={styles.ethIconBadge}>
              <FontAwesome5 name="ethereum" size={20} color="#fff" />
            </View>
            <Text style={styles.title}>Ethereum</Text>
          </View>

          <View style={styles.pricesLayout}>
            <View style={styles.livePriceSection}>
              <Text style={styles.livePriceValue}>
                {livePrice !== null ? formatUSD(livePrice) : "US$ ---"}
              </Text>
              <Text style={styles.priceLabel}>Cotação em tempo real</Text>
            </View>

            <View
              style={[styles.scrubSection, { opacity: isScrubbing ? 1 : 0 }]}
            >
              <Text style={styles.scrubbedPriceValue}>
                {scrubbedPrice !== null ? formatUSD(scrubbedPrice) : "US$ ---"}
              </Text>
              <Text style={styles.scrubLabel}>
                Preço na posição selecionada
              </Text>
            </View>
          </View>

          {/* Worklet Invisível para pescar o valor e enviar para a JS Thread */}
          <LineChart.PriceText
            style={{ position: "absolute", opacity: 0 }}
            format={({ value }) => {
              "worklet";
              const parsed = Number(value);
              if (value !== undefined && value !== null && !isNaN(parsed)) {
                runOnJS(updateScrubbedPrice)(parsed);
              }
              return "";
            }}
          />
        </View>

        <View style={styles.chartWrapper}>
          <LineChart height={300}>
            <LineChart.Path color="#627EEA" width={3}>
              <LineChart.Gradient color="#627EEA" />
            </LineChart.Path>

            <LineChart.CursorCrosshair
              color="rgba(255,255,255,0.4)"
              onEnded={() => {
                setIsScrubbing(false);
              }}
            >
              {/* 🔥 Tooltip agora agrupa o PriceText formatado via Worklet */}
              <LineChart.Tooltip style={styles.tooltipBox}>
                <LineChart.PriceText
                  style={styles.tooltipText}
                  format={({ value }) => {
                    "worklet";
                    const parsed = Number(value);
                    if (
                      value !== undefined &&
                      value !== null &&
                      !isNaN(parsed)
                    ) {
                      return `US$ ${parsed.toFixed(2)}`;
                    }
                    return "US$ ---";
                  }}
                />
              </LineChart.Tooltip>
            </LineChart.CursorCrosshair>
          </LineChart>
        </View>
      </LineChart.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  loadingText: { marginTop: 16, color: "#aaa" },
  errorText: { color: "#FF453A" },
  headerNav: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 24 },
  priceContainer: { paddingHorizontal: 24, marginBottom: 20 },
  titleRow: { flexDirection: "row", alignItems: "center" },
  ethIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#627EEA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  title: { color: "#fff", fontSize: 22 },
  pricesLayout: {
    marginTop: 12,
  },
  livePriceSection: {
    marginBottom: 8,
  },
  livePriceValue: { fontSize: 42, fontWeight: "700", color: "#fff" },
  priceLabel: { color: "#888", marginTop: 2, fontSize: 14 },
  scrubSection: {
    backgroundColor: "#1C1C1E",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  scrubbedPriceValue: { fontSize: 24, fontWeight: "600", color: "#627EEA" },
  scrubLabel: { color: "#888", marginTop: 2, fontSize: 12 },
  chartWrapper: { flex: 1 },
  tooltipText: { color: "#fff", fontWeight: "600" },
  tooltipBox: { backgroundColor: "#1C1C1E", padding: 8, borderRadius: 8 },
});
