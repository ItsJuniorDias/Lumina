import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity, // <-- Adicionado
} from "react-native";

import { api } from "@/server/api";
import { useRouter } from "expo-router";

export default function NFTsScreen() {
  const router = useRouter(); // <-- Hook de navegação

  const [marketItems, setMarketItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMarket = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/market");
      console.log(
        "[ ORDER_BOOK_SYNCED ]",
        response.data.assets.length,
        "itens encontrados.",
      );
      setMarketItems(response.data.assets);
    } catch (error) {
      console.error("[ GLOBAL_MARKET_ERROR ]", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarket();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMarket();
  };

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#39FF14" />
        <Text style={styles.loadingText}>[ SYNCING_GLOBAL_LEDGER ]</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>GLOBAL_MARKET</Text>
          {/* BOTÃO PARA ACESSAR MEUS NFTS */}
          <TouchableOpacity
            style={styles.portfolioButton}
            onPress={() => router.push("/my-nft")} // <-- Ajuste para o nome exato da sua rota
          >
            <Text style={styles.portfolioButtonText}>&gt; MY_PORTFOLIO</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusBox}>
          <View style={styles.dot} />
          <Text style={styles.statusText}>NETWORK_ONLINE</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#39FF14"
          />
        }
      >
        {marketItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>[ 0_ACTIVE_LISTINGS ]</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {marketItems.map((item) => (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/collection-details",
                    params: { collection: JSON.stringify(item) },
                  })
                } // <-- Navega para a página de detalhes do NFT
                key={item._id}
                style={[
                  styles.card,
                  { borderColor: item.glowColor || "#39FF14" },
                ]}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.nftImage}
                  resizeMode="cover"
                />

                <View style={styles.info}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nftName} numberOfLines={1}>
                        {item.nftName}
                      </Text>
                      <Text style={styles.seller}>
                        SELLER: {item.sellerAddress.slice(0, 6)}...
                        {item.sellerAddress.slice(-4)}
                      </Text>
                    </View>

                    <View style={styles.priceBox}>
                      <Text style={styles.priceLabel}>ASKING_PRICE</Text>
                      <Text style={styles.priceValue}>
                        $
                        {Number(item.priceUSD).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* [ NEW_NODE_INJECTED ] Renderização da Descrição */}
                  {item.description ? (
                    <Text style={styles.description} numberOfLines={2}>
                      // {item.description}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/collection-details",
                        params: { collection: JSON.stringify(item) },
                      })
                    }
                    style={styles.buyBadge}
                  >
                    <Text style={styles.buyText}>&gt; INITIATE_TRANSFER</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030305", paddingHorizontal: 20 },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: {
    color: "#39FF14",
    fontFamily: "Courier",
    marginTop: 20,
    letterSpacing: 2,
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start", // <-- Ajustado para o botão caber melhor
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    fontFamily: "Courier",
    marginBottom: 8, // <-- Espaço entre título e botão
  },
  portfolioButton: {
    backgroundColor: "rgba(255, 0, 255, 0.1)", // Fundo levemente magenta para destacar
    borderWidth: 1,
    borderColor: "#FF00FF",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 2,
    alignSelf: "flex-start",
  },
  portfolioButtonText: {
    color: "#FF00FF",
    fontSize: 12,
    fontFamily: "Courier",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#39FF14",
    paddingBottom: 4,
    marginTop: 6,
  },
  dot: { width: 6, height: 6, backgroundColor: "#39FF14" },
  statusText: { color: "#39FF14", fontSize: 10, fontFamily: "Courier" },
  scroll: { paddingBottom: 40 },
  listContainer: { display: "flex", flexDirection: "column", gap: 24 },
  card: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  nftImage: {
    width: "100%",
    height: 300,
    backgroundColor: "rgba(57, 255, 20, 0.05)",
  },
  info: { padding: 16 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  nftName: {
    color: "#FFF",
    fontFamily: "Courier",
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  seller: { color: "#FF00FF", fontSize: 10, fontFamily: "Courier" },
  priceBox: {
    alignItems: "flex-end",
    backgroundColor: "rgba(57, 255, 20, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(57, 255, 20, 0.3)",
  },
  priceLabel: {
    color: "#666",
    fontSize: 10,
    fontFamily: "Courier",
    marginBottom: 2,
  },
  priceValue: {
    color: "#39FF14",
    fontWeight: "900",
    fontSize: 16,
    fontFamily: "Courier",
  },
  description: {
    color: "#8E8E93",
    fontFamily: "Courier",
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  buyBadge: {
    backgroundColor: "rgba(57, 255, 20, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(57, 255, 20, 0.4)",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 2,
  },
  buyText: {
    color: "#39FF14",
    fontSize: 12,
    fontFamily: "Courier",
    fontWeight: "bold",
    letterSpacing: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: { color: "#FF00FF", fontSize: 16, fontFamily: "Courier" },
});
