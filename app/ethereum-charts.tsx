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

export default function EthereumChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCryptoData();
  }, []);

  const fetchCryptoData = async () => {
    try {
      const response = await api.get("/ethereum-chart?days=7");
      const result = await response.data;

      // Mapeia os dados e garante a ordenação cronológica (do mais antigo para o mais novo).
      // Isso é crucial para que a biblioteca assuma o último item como o valor "atual/inicial".
      const formattedData = result.data
        .map((item: any) => ({
          timestamp: item.timestamp,
          value: item.price,
        }))
        .sort((a: any, b: any) => a.timestamp - b.timestamp);

      setChartData(formattedData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
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

          {/* 🔥 Componente nativo da biblioteca */}
          <LineChart.PriceText
            style={styles.currentPrice}
            format={({ value }) => {
              "worklet"; // Obrigatório para rodar na UI Thread do Reanimated

              // Valida se o valor é válido antes de processar
              if (value === undefined || value === null || value === "") {
                return "R$ 0,00";
              }

              // Converte a string retornada pelo crosshair/provedor para número
              const parsedValue = Number(value);

              // Previne falhas se o valor não for um número válido (NaN)
              if (isNaN(parsedValue)) return "R$ 0,00";

              // Formata para duas casas decimais
              const fixedValue = parsedValue.toFixed(2);
              const parts = fixedValue.split(".");

              // Formatação simples compatível com worklets (que não suportam Intl.NumberFormat nativamente)
              return `R$ ${parts[0]},${parts[1]}`;
            }}
          />

          <Text style={styles.priceLabel}>Últimos 7 dias</Text>
        </View>

        <View style={styles.chartWrapper}>
          <LineChart height={300}>
            <LineChart.Path color="#627EEA" width={3}>
              <LineChart.Gradient color="#627EEA" />
            </LineChart.Path>

            {/* O CursorCrosshair ativa a interação por toque */}
            <LineChart.CursorCrosshair color="rgba(255,255,255,0.4)">
              <LineChart.Tooltip
                textStyle={styles.tooltipText}
                style={styles.tooltipBox}
              />
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
  priceContainer: { paddingHorizontal: 24, marginBottom: 40 },
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
  currentPrice: { fontSize: 42, fontWeight: "700", color: "#fff" },
  priceLabel: { color: "#888", marginTop: 4 },
  chartWrapper: { flex: 1 },
  tooltipText: { color: "#fff" },
  tooltipBox: { backgroundColor: "#1C1C1E", padding: 8, borderRadius: 8 },
});
