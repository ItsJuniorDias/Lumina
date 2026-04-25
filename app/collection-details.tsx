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
import { api } from "@/server/api"; // Substitua pelo caminho real do seu axios
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

  const { address } = useWalletConnectModal();

  console.log("ENDEREÇO DA CARTEIRA:", address); // Log para verificar o endereço retornado pelo WalletConnect

  // Mock do seu Vault conectado. No app real, puxe isso do seu estado global (Zustand/Context)
  const savedWalletAddress = address;

  // Listener do Webhook (Notificações)
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const payload = notification.request.content.data;

        if (payload?.tipo === "DEPOSITO_PIX") {
          console.log("// SINAL RECEBIDO: FIAT CONFIRMADO");
          // Opcional: Você pode mudar a UI para "Processando Swap..." se quiser ser mais granular
        }

        if (payload?.tipo === "SWAP_CRIPTO") {
          console.log("// SINAL RECEBIDO: CRIPTO TRANSFERIDA");
          setTransactionStatus("SUCCESS");

          // Fecha o modal automaticamente após o sucesso
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

  // Parsing seguro dos dados da coleção
  let collectionData;
  try {
    collectionData = JSON.parse(item.collection as string);
  } catch (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>ERRO CRÍTICO: DADOS CORROMPIDOS</Text>
      </View>
    );
  }

  const {
    name = "UNKNOWN_NODE",
    id = "0x00000000000000000",
    image = "",
    floorPriceUSD = "0",
    volumeChange24h = "0",
    volumeUSD = "0",
    uiModifiers = {},
  } = collectionData;

  const glowColor = uiModifiers.glowColor || "#00FFFF";
  const glassIntensity = uiModifiers.glassIntensity || 0.5;
  const volChange = parseFloat(volumeChange24h);
  const isVolPositive = volChange >= 0;

  const convertUSDToBRL = (usd) => {
    const exchangeRate = 5.0;
    return usd * exchangeRate;
  };

  console.log(convertUSDToBRL(parseFloat(floorPriceUSD)), "FLOOR PRICE BRL");

  // Handler para iniciar o fluxo de compra
  const handleAdquirirPosicao = async () => {
    setIsCheckoutVisible(true);
    setTransactionStatus("GENERATING");

    if (!address) {
      Alert.alert(
        "Carteira não conectada",
        "Por favor, conecte sua carteira para adquirir posição.",
      );
      setIsCheckoutVisible(false);
      setTransactionStatus("IDLE");
      return;
    }

    try {
      // 1. Pegar o Push Token real do aparelho para o Webhook saber quem notificar
      const { data: pushToken } = await Notifications.getExpoPushTokenAsync();

      // 2. Chamar a API passando BRL (Mock de R$ 500 para teste) e a carteira salva
      const amountInBRL = convertUSDToBRL(parseFloat(floorPriceUSD));

      console.log("AMOUNT EM BRL PARA O BACKEND:", amountInBRL);

      const response = await api.post("/create-pix", {
        amountInBRL,
        walletAddress: savedWalletAddress,
        pushToken: pushToken,
      });

      if (response.data.success) {
        setPixData(response.data);
        setTransactionStatus("WAITING_PAYMENT");
      }
    } catch (error) {
      Alert.alert("ERRO DE PROTOCOLO", "Falha ao gerar canal de pagamento.");
      setIsCheckoutVisible(false);
      setTransactionStatus("IDLE");
    }
  };

  const copyToClipboard = async () => {
    if (pixData?.pixCopiaECola) {
      await Clipboard.setStringAsync(pixData.pixCopiaECola);
      Alert.alert("COPIADO", "Chave injetada na área de transferência.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header / Navegação */}
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
        {/* Imagem em Destaque */}
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
              {id.substring(0, 10)}...{id.substring(id.length - 6)}
            </Text>
          </View>
        </View>

        {/* Título e Decoração */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { textShadowColor: glowColor }]}>
            {name}
          </Text>
          <View
            style={[styles.titleUnderline, { backgroundColor: glowColor }]}
          />
        </View>

        {/* Painel de Estatísticas */}
        <BlurView
          intensity={glassIntensity * 100}
          tint="dark"
          style={[styles.statsPanel, { borderColor: glowColor }]}
        >
          <Text style={styles.panelTitle}>// MÉTRICAS_DE_MERCADO</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>FLOOR PRICE</Text>
              <Text style={[styles.statValue, { color: glowColor }]}>
                ${" "}
                {parseFloat(floorPriceUSD).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>VOLUME TOTAL</Text>
              <Text style={styles.statValue}>
                ${" "}
                {parseFloat(volumeUSD).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>

            <View style={[styles.statBox, styles.statBoxFull]}>
              <Text style={styles.statLabel}>FLUTUAÇÃO 24H</Text>
              <Text
                style={[
                  styles.statValueLarge,
                  isVolPositive ? styles.positiveText : styles.negativeText,
                ]}
              >
                {isVolPositive ? "+" : ""}
                {volChange.toFixed(2)}%
              </Text>
            </View>
          </View>
        </BlurView>

        {/* Botão de Ação Cyberpunk que inicia o Checkout */}
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
            [ ADQUIRIR POSIÇÃO ]
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- MODAL DE CHECKOUT TERMINAL --- */}
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
                  {/* Se quiser renderizar o QR real, use react-native-qrcode-svg aqui */}
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
  titleUnderline: {
    height: 3,
    width: 60,
    marginTop: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
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

  // --- STYLES DO MODAL DE CHECKOUT ---
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
