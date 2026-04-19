import React, { useState, useEffect } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage"; // <-- Import adicionado

import { useSDK } from "@metamask/sdk-react-native";
import { router } from "expo-router";

export default function ProfileScreen() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [userName, setUserName] = useState("Alexandre Junior");
  const [isLoading, setIsLoading] = useState(false);

  const { sdk } = useSDK();

  // NOVO: useEffect para carregar o endereço salvo ao iniciar a tela
  useEffect(() => {
    const loadWalletData = async () => {
      try {
        const savedAddress = await AsyncStorage.getItem("@wallet_address");
        if (savedAddress) {
          setWalletAddress(savedAddress);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do AsyncStorage:", error);
      }
    };

    loadWalletData();
  }, []);

  const handleDisconnect = async () => {
    try {
      // 1. Termina a sessão na SDK do MetaMask (Limpa o cache real)
      if (sdk) {
        await sdk.terminate();
      }

      // 2. Limpa o estado local
      setWalletAddress(null);

      // 3. Limpa o AsyncStorage
      await AsyncStorage.removeItem("@wallet_address");

      Alert.alert(
        "Desconectado",
        "Sua carteira foi desconectada com sucesso e o cache foi limpo.",
      );
    } catch (error) {
      console.error("Erro ao desconectar/limpar cache:", error);
      Alert.alert("Erro", "Não foi possível limpar a sessão completamente.");
    }
  };

  // 1. Função para Conectar MetaMask (MetaMask SDK)
  const handleConnectMetaMask = async () => {
    try {
      setIsLoading(true);

      const accounts = await sdk?.connect();
      console.log(accounts, "ACCOUNTS");

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);

        // NOVO: Salva o endereço no AsyncStorage
        await AsyncStorage.setItem("@wallet_address", address);
      }

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      Alert.alert(
        "Erro de Conexão",
        "Não foi possível conectar à carteira. Verifique se o app do MetaMask está instalado.",
      );
    }
  };

  // 2. Função para o fluxo do Stripe
  const handleStripeConnect = async () => {
    try {
      Alert.alert("Stripe Connect", "Iniciando fluxo de compra/onboarding...");
    } catch (error) {
      Alert.alert("Erro", "Falha ao conectar com o provedor de pagamentos.");
    }
  };

  // 3. Função para Gerenciar Ethereum
  const handleManageEthereum = async () => {
    if (!walletAddress) {
      Alert.alert(
        "Carteira não conectada",
        "Por favor, conecte seu MetaMask primeiro.",
      );
      return;
    }
    Alert.alert(
      "Gerenciar",
      "Navegando para detalhes da carteira e transferências ETH...",
    );
  };

  // Helper para formatar a visualização da wallet
  const formatAddress = (address) => {
    if (!address) return "Carteira não conectada";
    return `${address.slice(0, 5)}...${address.slice(-4)}`;
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
            !walletAddress && styles.walletAddressEmpty,
          ]}
        >
          {formatAddress(walletAddress)}
        </Text>
      </BlurView>

      {/* Seção de Cripto & Integrações */}
      <Text style={styles.sectionTitle}>Carteira & Pagamentos</Text>
      <View style={styles.actionGroup}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleManageEthereum}
        >
          <View style={styles.actionIcon}>
            <SymbolView
              name="bitcoinsign.circle.fill"
              size={26}
              tintColor="#007AFF"
            />
          </View>
          <Text style={styles.actionText}>Gerenciar Ethereum</Text>
          <SymbolView name="chevron.right" size={16} tintColor="#C7C7CC" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.actionRow}
          onPress={handleStripeConnect}
        >
          <View style={styles.actionIcon}>
            <SymbolView name="creditcard.fill" size={26} tintColor="#34C759" />
          </View>
          <Text style={styles.actionText}>Comprar Cripto (Stripe Connect)</Text>
          <SymbolView name="chevron.right" size={16} tintColor="#C7C7CC" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Altera a ação do botão dependendo se já está conectado ou não */}
        <TouchableOpacity
          style={styles.actionRow}
          onPress={walletAddress ? handleDisconnect : handleConnectMetaMask}
        >
          <View style={styles.actionIcon}>
            <SymbolView
              name={walletAddress ? "link.circle.fill" : "link.circle"}
              size={26}
              tintColor={walletAddress ? "#FF3B30" : "#FF9500"}
            />
          </View>
          <Text
            style={[styles.actionText, walletAddress && { color: "#FF3B30" }]}
          >
            {walletAddress ? "Desconectar MetaMask" : "Conexão MetaMask"}
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
  // ... (seus estilos originais continuam exatamente os mesmos aqui)
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
