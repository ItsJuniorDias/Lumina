import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import { SymbolView } from "expo-symbols";
import { router } from "expo-router";

// Import do WalletConnect no lugar do MetaMask
import { useWalletConnectModal } from "@walletconnect/modal-react-native";

export default function ProfileScreen() {
  const [userName, setUserName] = useState("Usuário Anônimo");

  // Hook do WalletConnect. Ele já retorna se está conectado e o endereço.
  const { open, isConnected, address, provider } = useWalletConnectModal();

  const handleDisconnect = async () => {
    try {
      if (provider) {
        await provider.disconnect();
      }
      Alert.alert("Desconectado", "Sua carteira foi desconectada com sucesso.");
    } catch (error) {
      console.error("Erro ao desconectar:", error);
      Alert.alert("Erro", "Não foi possível limpar a sessão completamente.");
    }
  };

  // 1. Função para Conectar via WalletConnect (Binance Wallet)
  const handleConnectWallet = async () => {
    try {
      await open();
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Erro de Conexão",
        "Não foi possível abrir o modal de conexão.",
      );
    }
  };

  // 2. Função para o fluxo do pagarme (compra de cripto)
  const handleBuyCrypto = async () => {
    router.push("/buy-crypto");
  };

  // 3. Função para Gerenciar
  const handleManageCrypto = async () => {
    if (!isConnected) {
      Alert.alert(
        "Carteira não conectada",
        "Por favor, conecte sua carteira primeiro.",
      );
      return;
    }
    Alert.alert("Gerenciar", "Navegando para detalhes da carteira...");
  };

  // 4. NOVO: Função para navegar até a lista de NFTs
  const handleViewNFTs = () => {
    // Supondo que a rota para a tela de NFTs seja "/nfts"
    router.push("/nfts");
  };

  // Helper para formatar a visualização da wallet
  const formatAddress = (walletAddress) => {
    if (!walletAddress) return "Carteira não conectada";

    console.log(walletAddress, "WALLET ADDRESS");

    return `${walletAddress.slice(0, 5)}...${walletAddress.slice(-4)}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Profile */}
      <BlurView intensity={80} tint="light" style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <SymbolView
            name="person.crop.circle.fill"
            size={64}
            tintColor="#1C1C1E"
          />
        </View>
        <Text style={styles.name}>{userName}</Text>
        <Text
          style={[
            styles.walletAddress,
            !isConnected && styles.walletAddressEmpty,
          ]}
        >
          {formatAddress(address)}
        </Text>
      </BlurView>

      {/* Seção de Cripto & Integrações */}
      <Text style={styles.sectionTitle}>Carteira & Pagamentos</Text>
      <View style={styles.actionGroup}>
        <TouchableOpacity style={styles.actionRow} onPress={handleManageCrypto}>
          <View style={styles.actionIcon}>
            <SymbolView
              name="bitcoinsign.circle.fill"
              size={26}
              tintColor="#F3BA2F"
            />
          </View>
          <Text style={styles.actionText}>Gerenciar Cripto</Text>
          <SymbolView name="chevron.right" size={16} tintColor="#C7C7CC" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* NOVO: Botão de Meus NFTs */}
        <TouchableOpacity style={styles.actionRow} onPress={handleViewNFTs}>
          <View style={styles.actionIcon}>
            <SymbolView
              name="photo.stack.fill"
              size={26}
              tintColor="#AF52DE" // Roxo estilo iOS para diferenciar os NFTs
            />
          </View>
          <Text style={styles.actionText}>NFTs</Text>
          <SymbolView name="chevron.right" size={16} tintColor="#C7C7CC" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.actionRow} onPress={handleBuyCrypto}>
          <View style={styles.actionIcon}>
            <SymbolView name="creditcard.fill" size={26} tintColor="#34C759" />
          </View>
          <Text style={styles.actionText}>Comprar Cripto</Text>
          <SymbolView name="chevron.right" size={16} tintColor="#C7C7CC" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Altera a ação do botão dependendo se já está conectado ou não */}
        <TouchableOpacity
          style={styles.actionRow}
          onPress={isConnected ? handleDisconnect : handleConnectWallet}
        >
          <View style={styles.actionIcon}>
            <SymbolView
              name={isConnected ? "link.circle.fill" : "link.circle"}
              size={26}
              tintColor={isConnected ? "#FF3B30" : "#F3BA2F"}
            />
          </View>
          <Text
            style={[styles.actionText, isConnected && { color: "#FF3B30" }]}
          >
            {isConnected
              ? "Desconectar Carteira"
              : "Conectar Carteira (Binance)"}
          </Text>
          <SymbolView name="chevron.right" size={16} tintColor="#C7C7CC" />
        </TouchableOpacity>
      </View>

      {/* Ajustes Gerais */}
      <Text style={styles.sectionTitle}>Ajustes</Text>
      <View style={styles.actionGroup}>
        <TouchableOpacity style={styles.actionRow}>
          <View style={styles.actionIcon}>
            <SymbolView name="gearshape.fill" size={26} tintColor="#8E8E93" />
          </View>
          <Text style={styles.actionText}>Preferências</Text>
          <SymbolView name="chevron.right" size={16} tintColor="#C7C7CC" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.actionRow}>
          <View style={styles.actionIcon}>
            <SymbolView name="lock.fill" size={26} tintColor="#8E8E93" />
          </View>
          <Text style={styles.actionText}>Segurança</Text>
          <SymbolView name="chevron.right" size={16} tintColor="#C7C7CC" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  profileCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 32,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  avatarContainer: {
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  walletAddress: {
    fontSize: 14,
    color: "#8E8E93",
    fontFamily: "Courier",
    letterSpacing: 0.5,
  },
  walletAddressEmpty: {
    fontStyle: "italic",
    fontFamily: "System",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#8E8E93",
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 16,
  },
  actionGroup: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 24,
    overflow: "hidden",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  actionIcon: {
    width: 34,
    alignItems: "center",
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#C7C7CC",
    marginLeft: 62,
  },
});
