import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

export default function ReceiveScreen() {
  const handleCopy = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Lógica para copiar para o clipboard
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Receber</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.qrContainer}>
          {/* Fundo sempre branco para o QR Code ser legível por câmeras */}
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code-outline" size={150} color="#000" />
            {/* No futuro: usar react-native-qrcode-svg aqui */}
          </View>
        </View>

        <Text style={styles.networkWarning}>
          Envie apenas Ethereum (ERC-20) para este endereço. Outros ativos serão
          perdidos.
        </Text>

        <BlurView intensity={40} tint="dark" style={styles.addressCard}>
          <Text style={styles.addressLabel}>Seu Endereço Ethereum</Text>
          <Text style={styles.addressText}>0x71C7...a893e4f</Text>
          <TouchableOpacity
            style={styles.copyButton}
            activeOpacity={0.7}
            onPress={handleCopy}
          >
            <Ionicons name="copy-outline" size={18} color="#000" />
            <Text style={styles.copyButtonText}>Copiar Endereço</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 40,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, paddingHorizontal: 20, alignItems: "center" },
  qrContainer: { marginTop: 40, marginBottom: 32 },
  qrPlaceholder: {
    width: 240,
    height: 240,
    backgroundColor: "#fff",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  networkWarning: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  addressCard: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  addressLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginBottom: 8,
  },
  addressText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 24,
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 100,
    alignItems: "center",
  },
  copyButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
