import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { api } from "@/server/api";
import { useRouter } from "expo-router";

const USER_WALLET = "0x4bc1B5e71d30F726eF38e638af080255Fe775fC9";

export default function MyNFTsScreen() {
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/my-nfts/${USER_WALLET}`);
      console.log("RESPOSTA DO BACK-END:", response.data);
      setNfts(response.data.assets);
    } catch (error) {
      console.error("ERRO DE SINCRONIZAÇÃO COM A GRID:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssets();
  };

  const handleSellPress = (nft: any) => {
    router.push({
      pathname: "/sell-nft",
      params: { nft: JSON.stringify(nft) },
    });
  };

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00FFFF" />
        <Text style={styles.loadingText}>[ ESCANEANDO_BLOCKCHAIN ]</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header com Info da Wallet */}
      <View style={styles.header}>
        <View style={{ gap: 16 }}>
          <Text style={styles.title}>MY_ASSETS</Text>
          <Text style={styles.walletAddr}>
            {USER_WALLET.slice(0, 6)}...{USER_WALLET.slice(-4)}
          </Text>
        </View>

        <View style={styles.statusBox}>
          <View style={styles.dot} />
          <Text style={styles.statusText}>LIVE_DATA</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00FFFF"
          />
        }
      >
        {nfts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>[ 0_ASSETS_FOUND ]</Text>
            <Text style={styles.emptySubText}>
              EXPLORE O MERCADO E ADICIONE ATIVOS À SUA CARTEIRA.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {nfts.map((item, index) => (
              <TouchableOpacity
                key={`${item.id}-${index}`}
                style={[
                  styles.card,
                  { borderColor: item.uiModifiers?.glowColor || "#00FFFF" },
                ]}
                onPress={() => handleSellPress(item)}
                activeOpacity={0.8}
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
                        {item.name}
                      </Text>
                      <Text style={styles.tokenId}>
                        ID: #{item.id?.slice(0, 8)}
                      </Text>
                    </View>

                    <View style={styles.floorBox}>
                      <Text style={styles.floorPriceText}>FLOOR</Text>
                      <Text style={styles.floorValue}>
                        ${item.floorPriceUSD}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.description} numberOfLines={3}>
                    {item.description ||
                      "NO_DATA_PROVIDED: Nenhuma descrição registrada no contrato inteligente deste ativo."}
                  </Text>

                  <View style={styles.sellBadge}>
                    <Text style={styles.sellText}>
                      &gt; LIST_ASSET_FOR_SALE
                    </Text>
                  </View>
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
  container: {
    flex: 1,
    backgroundColor: "#030305",
    paddingHorizontal: 20,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#00FFFF",
    fontFamily: "Courier",
    marginTop: 20,
    letterSpacing: 2,
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  title: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    fontFamily: "Courier",
  },
  walletAddr: {
    color: "#FF00FF",
    fontSize: 12,
    fontFamily: "Courier",
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#39FF14",
    paddingBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    backgroundColor: "#39FF14",
  },
  statusText: {
    color: "#39FF14",
    fontSize: 10,
    fontFamily: "Courier",
  },
  scroll: {
    paddingBottom: 40,
  },
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 24, // Espaçamento maior entre os cards
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  nftImage: {
    width: "100%",
    height: 300, // Imagem em destaque com altura fixa
    backgroundColor: "rgba(0, 255, 255, 0.05)",
  },
  info: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  nftName: {
    color: "#FFF",
    fontFamily: "Courier",
    fontWeight: "900",
    fontSize: 18, // Fonte maior
    marginBottom: 4,
    textTransform: "uppercase",
  },
  tokenId: {
    color: "#666",
    fontSize: 12, // Fonte maior
    fontFamily: "Courier",
  },
  floorBox: {
    alignItems: "flex-end",
    backgroundColor: "rgba(57, 255, 20, 0.05)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(57, 255, 20, 0.2)",
  },
  floorPriceText: {
    color: "#666",
    fontSize: 10,
    fontFamily: "Courier",
    marginBottom: 2,
  },
  floorValue: {
    color: "#39FF14",
    fontWeight: "900",
    fontSize: 16, // Valor financeiro mais destacado
    fontFamily: "Courier",
  },
  description: {
    color: "#AAA",
    fontSize: 13, // Descrição bem legível
    fontFamily: "Courier",
    marginBottom: 20,
    lineHeight: 18,
  },
  sellBadge: {
    backgroundColor: "rgba(0, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.4)",
    paddingVertical: 12, // Botão mais alto e clicável
    alignItems: "center",
    borderRadius: 2,
  },
  sellText: {
    color: "#00FFFF",
    fontSize: 12, // Texto do botão maior
    fontFamily: "Courier",
    fontWeight: "bold",
    letterSpacing: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: {
    color: "#FF00FF",
    fontSize: 16,
    fontFamily: "Courier",
    marginBottom: 10,
  },
  emptySubText: {
    color: "#444",
    textAlign: "center",
    fontFamily: "Courier",
    fontSize: 12,
    paddingHorizontal: 20,
  },
});
