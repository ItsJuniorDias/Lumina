import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/server/api";

const USER_WALLET = "0x4bc1B5e71d30F726eF38e638af080255Fe775fC9";

export default function SellNftScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Decodifica o NFT que veio da MyNFTsScreen
  const nft = params.nft ? JSON.parse(params.nft as string) : null;

  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmListing = async () => {
    if (!price || isNaN(Number(price))) {
      Alert.alert("[ ERROR ]", "INSIRA UM VALOR VÁLIDO EM USD.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Monta o payload exatamente como o backend Mongoose espera
      const payload = {
        walletAddress: USER_WALLET,
        name: nft.name,
        id: nft.id,
        description: nft.description || "NO_DATA_PROVIDED",
        image: nft.image,
        price: parseFloat(price),
        uiModifiers: {
          glowColor: nft.uiModifiers?.glowColor || "#00FFFF",
        },
      };

      console.log("[ UPLOADING_TO_MAINNET ]", payload);

      const response = await api.post("/list", payload);

      if (response.data.success) {
        console.log("[ ASSET_LISTED_SUCCESS ]", response.data);
        // Redireciona para a aba do mercado após o sucesso
        router.push("/nfts");
      }
    } catch (error) {
      console.error("[ API_ERROR ]", error);
      Alert.alert("[ SYNC_FAILED ]", "NÃO FOI POSSÍVEL LISTAR O ATIVO.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!nft) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>&gt; INITIALIZE_SELL_PROTOCOL</Text>

      <View style={styles.nftPreview}>
        <Image source={{ uri: nft.image }} style={styles.previewImage} />
        <Text style={styles.nftName}>{nft.name}</Text>
        <Text style={styles.nftId}>ID: #{nft.id?.slice(0, 8)}</Text>
      </View>

      <Text style={styles.inputLabel}>SET_PRICE (USD):</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor="rgba(57, 255, 20, 0.3)"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
        editable={!isSubmitting}
        returnKeyType="done"
      />

      <TouchableOpacity
        style={[styles.btn, isSubmitting && styles.btnDisabled]}
        onPress={handleConfirmListing}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#00FFFF" />
        ) : (
          <Text style={styles.btnText}>[ EXECUTE_CONTRACT ]</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030305",
    padding: 20,
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFF",
    fontFamily: "Courier",
    fontSize: 18,
    marginBottom: 30,
    fontWeight: "bold",
  },
  nftPreview: { alignItems: "center", marginBottom: 40 },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  nftName: {
    color: "#FFF",
    fontFamily: "Courier",
    fontSize: 16,
    fontWeight: "900",
  },
  nftId: { color: "#666", fontFamily: "Courier", fontSize: 12, marginTop: 4 },
  inputLabel: {
    color: "#39FF14",
    fontFamily: "Courier",
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#39FF14",
    backgroundColor: "rgba(57, 255, 20, 0.05)",
    color: "#39FF14",
    fontSize: 24,
    padding: 16,
    fontFamily: "Courier",
    marginBottom: 40,
    borderRadius: 2,
  },
  btn: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "#00FFFF",
    padding: 18,
    alignItems: "center",
    borderRadius: 2,
  },
  btnDisabled: { opacity: 0.5, borderColor: "#666" },
  btnText: {
    color: "#00FFFF",
    fontFamily: "Courier",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 2,
  },
});
