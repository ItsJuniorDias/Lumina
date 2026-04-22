import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "@/server/api";

// Tipagem atualizada com os novos campos
type Transaction = {
  id: string;
  type: "DEPOSIT" | "WITHDRAW" | "BUY" | "SELL";
  asset: string;
  amount: string;
  date: string;
  status: string;
  // Campos exclusivos de Ordens
  executedQty?: string;
  orderType?: string;
  pair?: string;
  price?: string;
};

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ORDERS" | "TRANSFERS">("ALL");

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await api.get("/history-binance");
        if (response.data.history) {
          setTransactions(response.data.history);
        }
      } catch (error: any) {
        console.error("Erro ao buscar histórico:", error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Executado";
      case "PENDING":
        return "Aberto";
      case "CANCELED":
        return "Cancelado";
      case "REJECTED":
        return "Rejeitado";
      default:
        return status;
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "ALL") return true;
    if (filter === "ORDERS") return tx.type === "BUY" || tx.type === "SELL";
    if (filter === "TRANSFERS")
      return tx.type === "DEPOSIT" || tx.type === "WITHDRAW";
    return true;
  });

  const OrderItem = ({ tx }: { tx: Transaction }) => {
    const isBuy = tx.type === "BUY";
    const typeColor = isBuy ? "#0ECB81" : "#F6465D"; // Verde e Vermelho da Binance
    const typeText = isBuy ? "Comprar" : "Vender";
    const statusText = getStatusDisplay(tx.status);

    // Tratamento de Data e Hora
    const dateObj = new Date(tx.date);
    const formattedDate = dateObj.toLocaleDateString("sv-SE");
    const formattedTime = dateObj.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Formatação do Par (ex: ETHUSDT -> ETH/USDT)
    const displayPair =
      tx.pair && tx.asset
        ? tx.pair.replace(tx.asset, `${tx.asset}/`)
        : `${tx.asset}/USDT`;

    // Formatação do Tipo de Ordem
    const displayOrderType = tx.orderType === "MARKET" ? "Mercado" : "Limite";

    // Formatação de Preço (ex: 2409.99 -> 2.409,99)
    const formattedPrice =
      tx.price && Number(tx.price) > 0
        ? Number(tx.price).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
          })
        : "--";

    return (
      <View style={styles.orderCard}>
        {/* Cabeçalho do Card */}
        <View style={styles.orderHeader}>
          <View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={styles.orderPair}>{displayPair}</Text>
              <Ionicons name="share-social-outline" size={14} color="#848E9C" />
            </View>
            <Text style={[styles.orderType, { color: typeColor }]}>
              {displayOrderType} / {typeText}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.orderDate}>
              {formattedDate} {formattedTime}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color="#848E9C"
              style={{ marginLeft: 4 }}
            />
          </View>
        </View>

        {/* Linhas de Detalhes */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Valor</Text>
          <Text style={styles.detailValue}>
            {tx.executedQty} / {tx.amount}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Preço</Text>
          <Text style={styles.detailValue}>
            {formattedPrice} /{" "}
            {displayOrderType === "Mercado" ? "Market" : "Limit"}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <Text
            style={[
              styles.detailValue,
              { color: tx.status === "COMPLETED" ? "#0ECB81" : "#EAECEF" },
            ]}
          >
            {statusText}
          </Text>
        </View>
      </View>
    );
  };

  const TransferItem = ({ tx }: { tx: Transaction }) => {
    const isDeposit = tx.type === "DEPOSIT";
    const dateObj = new Date(tx.date);
    const formattedDate = `${dateObj.toLocaleDateString("sv-SE")} ${dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderPair}>{tx.asset}</Text>
            <Text
              style={[
                styles.orderType,
                { color: isDeposit ? "#0ECB81" : "#F6465D" },
              ]}
            >
              {isDeposit ? "Depósito" : "Saque"}
            </Text>
          </View>
          <Text style={styles.orderDate}>{formattedDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Montante</Text>
          <Text style={styles.detailValue}>{tx.amount}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <Text
            style={[
              styles.detailValue,
              { color: tx.status === "COMPLETED" ? "#0ECB81" : "#EAECEF" },
            ]}
          >
            {getStatusDisplay(tx.status)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFillObject} backgroundColor="#161A1E" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#EAECEF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico de ordens</Text>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="download-outline" size={20} color="#EAECEF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterTabs}>
        <TouchableOpacity onPress={() => setFilter("ALL")}>
          <Text
            style={[styles.tabText, filter === "ALL" && styles.tabTextActive]}
          >
            Tudo
          </Text>
          {filter === "ALL" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter("ORDERS")}>
          <Text
            style={[
              styles.tabText,
              filter === "ORDERS" && styles.tabTextActive,
            ]}
          >
            Ordens
          </Text>
          {filter === "ORDERS" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter("TRANSFERS")}>
          <Text
            style={[
              styles.tabText,
              filter === "TRANSFERS" && styles.tabTextActive,
            ]}
          >
            Transferências
          </Text>
          {filter === "TRANSFERS" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#627EEA"
            style={{ marginTop: 50 }}
          />
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Sem registros.</Text>
          </View>
        ) : (
          filteredTransactions.map((tx) =>
            tx.type === "BUY" || tx.type === "SELL" ? (
              <OrderItem key={tx.id} tx={tx} />
            ) : (
              <TransferItem key={tx.id} tx={tx} />
            ),
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#161A1E" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#EAECEF",
    fontSize: 18,
    fontWeight: "600",
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2B3139",
    gap: 24,
    marginBottom: 10,
  },
  tabText: {
    color: "#848E9C",
    fontSize: 15,
    fontWeight: "500",
    paddingBottom: 12,
  },
  tabTextActive: {
    color: "#EAECEF",
    fontWeight: "600",
  },
  activeIndicator: {
    height: 3,
    backgroundColor: "#627EEA",
    borderRadius: 2,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  orderCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2B3139",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderPair: {
    color: "#EAECEF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  orderType: {
    fontSize: 13,
    fontWeight: "500",
  },
  orderDate: {
    color: "#848E9C",
    fontSize: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    color: "#848E9C",
    fontSize: 13,
  },
  detailValue: {
    color: "#EAECEF",
    fontSize: 13,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyText: {
    color: "#848E9C",
    fontSize: 14,
  },
});
