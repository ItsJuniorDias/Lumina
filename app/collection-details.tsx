import { useLocalSearchParams, router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SymbolView } from "expo-symbols";
import { BlurView } from "expo-blur";
import * as Notifications from "expo-notifications";
import * as Clipboard from "expo-clipboard";
import { api } from "@/server/api";
import { useWalletConnectModal } from "@walletconnect/modal-react-native";

// Configuração para exibir notificações no topo mesmo com o app aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function CollectionDetailsScreen() {
  const item = useLocalSearchParams();

  // Estados do fluxo de Checkout
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [transactionStatus, setTransactionStatus] = useState<
    "IDLE" | "GENERATING" | "WAITING_PAYMENT" | "SUCCESS"
  >("IDLE");

  // [ NEW_NODE ] Estado dos dados dinâmicos do mercado
  const [marketStats, setMarketStats] = useState({
    volumeUSD: 0,
    change24h: 0,
    isSyncing: true,
  });

  const { address } = useWalletConnectModal();
  const savedWalletAddress = address;

  // Listener do Webhook (Notificações)
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const payload = notification.request.content.data;

        if (payload?.tipo === "DEPOSITO_PIX") {
          console.log("// SINAL RECEBIDO: FIAT CONFIRMADO");
        }

        if (payload?.tipo === "SWAP_CRIPTO") {
          console.log("// SINAL RECEBIDO: CRIPTO TRANSFERIDA");
          setTransactionStatus("SUCCESS");

          setTimeout(() => {
            setIsCheckoutVisible(false);
            setTransactionStatus("IDLE");
            setPixData(null);
          }, 4000);
        }
      },
    );

    return () => subscription.remove();
  }, []);

  // [ NEW_NODE ] Fetch Dinâmico de ESTATÍSTICAS DO MERCADO
  useEffect(() => {
    const fetchMarketTelemetry = async () => {
      try {
        // Exemplo: Buscando dados reais de volume global via CoinGecko API
        // Você pode trocar por: await api.get(`/asset-stats/${_id}`)
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true",
        );
        const data = await response.json();

        setMarketStats({
          volumeUSD: data.ethereum.usd_24h_vol,
          change24h: data.ethereum.usd_24h_change,
          isSyncing: false,
        });
      } catch (error) {
        console.warn(
          "[ TELEMETRY_ERROR ] Usando dados de fallback da cache.",
          error,
        );
        // Fallback caso a API falhe ou dê rate limit
        setMarketStats({
          volumeUSD: 0,
          change24h: 0,
          isSyncing: false,
        });
      }
    };

    fetchMarketTelemetry();
  }, []);

  // Parsing seguro dos dados do novo formato de contrato
  let assetData;
  try {
    assetData = JSON.parse((item.asset || item.collection) as string);
  } catch (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          [ ERRO CRÍTICO: DADOS CORROMPIDOS ]
        </Text>
      </View>
    );
  }

  const {
    nftName = "UNKNOWN_NODE",
    _id = "0x00000000000000000",
    image = "",
    priceUSD = 0,
    glowColor = "#00FFFF",
    sellerAddress = "0x0000",
    description = "",
  } = assetData;

  const glassIntensity = 0.5;

  // Usando os dados do estado (API) em vez de hardcoded
  const volChange = marketStats.change24h;
  const isVolPositive = volChange >= 0;

  const convertUSDToBRL = (usd: number) => {
    const exchangeRate = 5.0; // Pode ser alterado para buscar dinâmica também
    return usd * exchangeRate;
  };

  const handleAdquirirPosicao = async () => {
    setIsCheckoutVisible(true);
    setTransactionStatus("GENERATING");

    if (!address) {
      Alert.alert(
        "CONEXÃO_FALHA",
        "Conecte sua carteira na rede principal para prosseguir.",
      );
      setIsCheckoutVisible(false);
      setTransactionStatus("IDLE");
      return;
    }

    try {
      const { data: pushToken } = await Notifications.getExpoPushTokenAsync();
      const amountInBRL = convertUSDToBRL(Number(priceUSD));

      const response = await api.post("/create-pix", {
        amountInBRL,
        walletAddress: savedWalletAddress,
        pushToken: pushToken,
        assetId: _id,
      });

      if (response.data.success) {
        setPixData(response.data);
        setTransactionStatus("WAITING_PAYMENT");
      }
    } catch (error) {
      Alert.alert(
        "ERRO_DE_PROTOCOLO",
        "Falha na geração do canal de liquidez.",
      );
      setIsCheckoutVisible(false);
      setTransactionStatus("IDLE");
    }
  };

  const copyToClipboard = async () => {
    if (pixData?.pixCopiaECola) {
      await Clipboard.setStringAsync(pixData.pixCopiaECola);
      Alert.alert("COPIADO", "Chave de transferência alocada na memória.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <SymbolView name="chevron.left" size={24} tintColor="#FFF" />
          <Text style={styles.backText}>VOLTAR</Text>
        </TouchableOpacity>
        <View style={styles.statusBadge}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: glowColor, shadowColor: glowColor },
            ]}
          />
          <Text style={[styles.statusText, { color: glowColor }]}>
            NÓ CONECTADO
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroImageContainer,
            { borderColor: glowColor, shadowColor: glowColor },
          ]}
        >
          <Image source={{ uri: image }} style={styles.heroImage} />
          <View
            style={[
              styles.scanlineOverlay,
              { backgroundColor: `${glowColor}15` },
            ]}
          />

          <View style={styles.idBadge}>
            <Text style={styles.idText} numberOfLines={1}>
              ID: {_id.substring(0, 8)}...{_id.substring(_id.length - 6)}
            </Text>
          </View>
        </View>

        <View style={styles.titleContainer}>
          <Text style={[styles.title, { textShadowColor: glowColor }]}>
            {nftName}
          </Text>
          <Text style={styles.sellerText}>
            SELLER: {sellerAddress.slice(0, 6)}...{sellerAddress.slice(-4)}
          </Text>
          <View
            style={[styles.titleUnderline, { backgroundColor: glowColor }]}
          />
        </View>

        {description ? (
          <View
            style={[
              styles.descriptionContainer,
              { borderLeftColor: glowColor },
            ]}
          >
            <Text style={styles.sectionLabel}>// SYSTEM_LOGS_DESC</Text>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        ) : null}

        <BlurView
          intensity={glassIntensity * 100}
          tint="dark"
          style={[styles.statsPanel, { borderColor: glowColor }]}
        >
          <Text style={styles.panelTitle}>// DADOS_DO_CONTRATO</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ASKING PRICE</Text>
              <Text style={[styles.statValue, { color: glowColor }]}>
                ${" "}
                {Number(priceUSD).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>GLOBAL VOLUME</Text>
              {marketStats.isSyncing ? (
                <Text style={styles.statValueLoading}>SYNCING...</Text>
              ) : (
                <Text style={styles.statValue}>
                  $
                  {marketStats.volumeUSD.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              )}
            </View>

            <View style={[styles.statBox, styles.statBoxFull]}>
              <Text style={styles.statLabel}>INDEX_24H</Text>
              {marketStats.isSyncing ? (
                <Text style={styles.statValueLoading}>SYNCING...</Text>
              ) : (
                <Text
                  style={[
                    styles.statValueLarge,
                    isVolPositive ? styles.positiveText : styles.negativeText,
                  ]}
                >
                  {isVolPositive ? "+" : ""}
                  {volChange.toFixed(2)}%
                </Text>
              )}
            </View>
          </View>
        </BlurView>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { borderColor: glowColor, shadowColor: glowColor },
          ]}
          activeOpacity={0.7}
          onPress={handleAdquirirPosicao}
        >
          <Text
            style={[
              styles.actionButtonText,
              { color: glowColor, textShadowColor: glowColor },
            ]}
          >
            [ EXECUTAR SMART CONTRACT ]
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isCheckoutVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.terminalBox}>
            <Text style={styles.modalTitle}>// CANAL_DE_LIQUIDEZ</Text>

            {transactionStatus === "GENERATING" && (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="large" color="#00FFFF" />
                <Text style={styles.generatingText}>GERANDO CHAVE PIX...</Text>
              </View>
            )}

            {transactionStatus === "WAITING_PAYMENT" && pixData && (
              <View style={styles.pixContainer}>
                <Text style={styles.warningText}>
                  AGUARDANDO DEPÓSITO FIAT.
                </Text>

                <View style={styles.qrCodePlaceholder}>
                  <SymbolView
                    name="qrcode.viewfinder"
                    size={60}
                    tintColor="#00FFFF"
                  />
                </View>

                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copyToClipboard}
                >
                  <Text style={styles.copyButtonText}>
                    [ COPIAR CHAVE PIX ]
                  </Text>
                  <SymbolView name="doc.on.doc" size={16} tintColor="#05050A" />
                </TouchableOpacity>

                <Text style={styles.waitingText}>
                  A IA detectará o pagamento e executará o swap automaticamente.
                </Text>
              </View>
            )}

            {transactionStatus === "SUCCESS" && (
              <View style={styles.successContainer}>
                <SymbolView
                  name="checkmark.shield.fill"
                  size={64}
                  tintColor="#39FF14"
                />
                <Text style={styles.successTitle}>TRANSFERÊNCIA CONCLUÍDA</Text>
                <Text style={styles.successSub}>
                  Os fundos já estão no seu Vault.
                </Text>
              </View>
            )}

            {transactionStatus !== "SUCCESS" && (
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => {
                  setIsCheckoutVisible(false);
                  setTransactionStatus("IDLE");
                  setPixData(null);
                }}
              >
                <Text style={styles.cancelText}>ABORTAR_OPERAÇÃO</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030305",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#030305",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#FF003C",
    fontFamily: "Courier",
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    color: "#FFF",
    fontFamily: "Courier",
    fontWeight: "bold",
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statusDot: {
    width: 6,
    height: 6,
    marginRight: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    fontFamily: "Courier",
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroImageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  scanlineOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  idBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  idText: {
    color: "#8E8E93",
    fontFamily: "Courier",
    fontSize: 12,
    textAlign: "center",
    letterSpacing: 2,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    fontFamily: "Courier",
    textTransform: "uppercase",
    letterSpacing: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  sellerText: {
    color: "#FF00FF",
    fontFamily: "Courier",
    fontSize: 12,
    marginTop: 4,
  },
  titleUnderline: {
    height: 3,
    width: 60,
    marginTop: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  descriptionContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderLeftWidth: 2,
  },
  sectionLabel: {
    color: "#666670",
    fontFamily: "Courier",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 1,
  },
  descriptionText: {
    color: "#8E8E93",
    fontFamily: "Courier",
    fontSize: 14,
    lineHeight: 22,
  },
  statsPanel: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 16,
    backgroundColor: "rgba(20, 20, 25, 0.7)",
    marginBottom: 24,
  },
  panelTitle: {
    color: "#666670",
    fontFamily: "Courier",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 16,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statBox: {
    width: "47%",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 4,
  },
  statBoxFull: {
    width: "100%",
  },
  statLabel: {
    fontSize: 10,
    color: "#8E8E93",
    fontWeight: "700",
    fontFamily: "Courier",
    letterSpacing: 1,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "Courier",
    color: "#FFF",
  },
  statValueLoading: {
    fontSize: 12,
    fontWeight: "900",
    fontFamily: "Courier",
    color: "#00FFFF",
    letterSpacing: 1,
  },
  statValueLarge: {
    fontSize: 24,
    fontWeight: "900",
    fontFamily: "Courier",
  },
  positiveText: {
    color: "#39FF14",
    textShadowColor: "#39FF14",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  negativeText: {
    color: "#FF003C",
    textShadowColor: "#FF003C",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  actionButton: {
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  actionButtonText: {
    fontFamily: "Courier",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(3, 3, 5, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  terminalBox: {
    width: "100%",
    backgroundColor: "#0A0A0F",
    borderWidth: 1,
    borderColor: "#00FFFF",
    borderRadius: 4,
    padding: 24,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  modalTitle: {
    color: "#666670",
    fontFamily: "Courier",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 24,
    letterSpacing: 1,
  },
  loadingWrapper: {
    alignItems: "center",
    paddingVertical: 32,
  },
  generatingText: {
    color: "#00FFFF",
    fontFamily: "Courier",
    marginTop: 16,
    fontSize: 12,
  },
  pixContainer: {
    alignItems: "center",
  },
  warningText: {
    color: "#FF00FF",
    fontFamily: "Courier",
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 24,
    textAlign: "center",
  },
  qrCodePlaceholder: {
    width: 150,
    height: 150,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00FFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderRadius: 2,
    marginBottom: 16,
  },
  copyButtonText: {
    color: "#05050A",
    fontFamily: "Courier",
    fontWeight: "900",
    fontSize: 14,
  },
  waitingText: {
    color: "#8E8E93",
    fontFamily: "Courier",
    fontSize: 10,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  successTitle: {
    color: "#39FF14",
    fontFamily: "Courier",
    fontWeight: "900",
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
    textShadowColor: "#39FF14",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  successSub: {
    color: "#8E8E93",
    fontFamily: "Courier",
    fontSize: 12,
    textAlign: "center",
  },
  cancelModalButton: {
    marginTop: 24,
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 0, 60, 0.3)",
  },
  cancelText: {
    color: "#FF003C",
    fontFamily: "Courier",
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
