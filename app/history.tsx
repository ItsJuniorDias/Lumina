import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { api } from "@/server/api";

// Tipagem da nossa transação
type Transaction = {
  id: string;
  type: "DEPOSIT" | "WITHDRAW" | "BUY" | "SELL";
  asset: string;
  amount: string;
  date: string;
  status: string;
};

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "TRADES" | "TRANSFERS">("ALL");

  useEffect(() => {
    async function fetchHistory() {
      try {
        // Substitua pela sua rota real no backend
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

  // Configuração visual baseada no tipo de transação
  const getTransactionVisuals = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return {
          icon: "arrow-down-outline",
          color: "#26A17B",
          label: "Depósito",
        };
      case "WITHDRAW":
        return { icon: "arrow-up-outline", color: "#FF3B30", label: "Saque" };
      case "BUY":
        return {
          icon: "add-circle-outline",
          color: "#627EEA",
          label: "Compra",
        };
      case "SELL":
        return {
          icon: "remove-circle-outline",
          color: "#F7931A",
          label: "Venda",
        };
      default:
        return {
          icon: "swap-horizontal",
          color: "#888",
          label: "Movimentação",
        };
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "ALL") return true;
    if (filter === "TRADES") return tx.type === "BUY" || tx.type === "SELL";
    if (filter === "TRANSFERS")
      return tx.type === "DEPOSIT" || tx.type === "WITHDRAW";
    return true;
  });

  const TransactionItem = ({ tx }: { tx: Transaction }) => {
    const visual = getTransactionVisuals(tx.type);
    const dateObj = new Date(tx.date);
    const formattedDate = dateObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
    const formattedTime = dateObj.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Determina se o valor deve ter sinal de + ou -
    const sign = tx.type === "DEPOSIT" || tx.type === "BUY" ? "+" : "-";
    const amountColor =
      tx.type === "DEPOSIT" || tx.type === "BUY" ? "#34C759" : "#fff";

    return (
      <View style={styles.transactionRow}>
        <View style={styles.transactionLeft}>
          <BlurView intensity={20} tint="light" style={styles.iconCircle}>
            <Ionicons
              name={visual.icon as any}
              size={20}
              color={visual.color}
            />
          </BlurView>
          <View>
            <Text style={styles.transactionLabel}>
              {visual.label} {tx.asset}
            </Text>
            <Text style={styles.transactionDate}>
              {formattedDate} às {formattedTime}
            </Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {sign}
            {tx.amount}
          </Text>
          <Text style={styles.transactionStatus}>
            {tx.status === "COMPLETED" ? "Concluído" : "Pendente"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#2A1B54", "#080414", "#000000"]}
        locations={[0, 0.4, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === "ALL" && styles.filterActive]}
          onPress={() => setFilter("ALL")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "ALL" && styles.filterTextActive,
            ]}
          >
            Tudo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "TRADES" && styles.filterActive,
          ]}
          onPress={() => setFilter("TRADES")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "TRADES" && styles.filterTextActive,
            ]}
          >
            Trades
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === "TRANSFERS" && styles.filterActive,
          ]}
          onPress={() => setFilter("TRANSFERS")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "TRANSFERS" && styles.filterTextActive,
            ]}
          >
            Transferências
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#5856D6"
            style={{ marginTop: 50 }}
          />
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="receipt-outline"
              size={48}
              color="rgba(255,255,255,0.2)"
            />
            <Text style={styles.emptyText}>
              Nenhuma movimentação encontrada.
            </Text>
          </View>
        ) : (
          filteredTransactions.map((tx) => (
            <TransactionItem key={tx.id} tx={tx} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  filterActive: {
    backgroundColor: "rgba(88, 86, 214, 0.3)", // Tom sutil de roxo
    borderColor: "#5856D6",
  },
  filterText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    overflow: "hidden",
  },
  transactionLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  transactionDate: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  transactionStatus: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 15,
    marginTop: 16,
  },
});
