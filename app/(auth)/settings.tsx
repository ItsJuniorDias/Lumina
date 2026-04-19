import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons"; // Biblioteca padrão do Expo

export default function SettingsScreen() {
  const [isFaceIdEnabled, setIsFaceIdEnabled] = React.useState(true);

  // Componente para cada linha de ajuste
  const SettingRow = ({
    icon,
    name,
    color,
    value,
    onPress,
    isSwitch = false,
  }: any) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={isSwitch}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon} size={20} color="#fff" />
        </View>
        <Text style={styles.rowName}>{name}</Text>
      </View>
      <View style={styles.rowRight}>
        {isSwitch ? (
          <Switch
            value={isFaceIdEnabled}
            onValueChange={setIsFaceIdEnabled}
            trackColor={{ false: "#3e3e3e", true: "#34C759" }}
          />
        ) : (
          <>
            {value && <Text style={styles.rowValue}>{value}</Text>}
            <Ionicons
              name="chevron-forward"
              size={18}
              color="rgba(255,255,255,0.3)"
            />
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Ajustes</Text>

      {/* Secção: Conta e Segurança */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SEGURANÇA</Text>
        <View style={styles.group}>
          <SettingRow
            icon="shield-checkmark"
            name="Backup da Seed Phrase"
            color="#5856D6"
            onPress={() => {}}
          />
          <SettingRow
            icon="finger-print"
            name="Usar Face ID"
            color="#34C759"
            isSwitch={true}
          />
          <SettingRow
            icon="lock-closed"
            name="Alterar Código PIN"
            color="#FF9500"
            onPress={() => {}}
          />
        </View>
      </View>

      {/* Secção: Rede e Web3 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CONECTIVIDADE</Text>
        <View style={styles.group}>
          <SettingRow
            icon="globe-outline"
            name="Rede Ativa"
            value="Ethereum Mainnet"
            color="#007AFF"
            onPress={() => {}}
          />
          <SettingRow
            icon="list"
            name="Histórico de Transações"
            color="#8E8E93"
            onPress={() => {}}
          />
        </View>
      </View>

      {/* Secção: Aplicação */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GERAL</Text>
        <View style={styles.group}>
          <SettingRow
            icon="moon"
            name="Tema"
            value="Escuro"
            color="#1C1C1E"
            onPress={() => {}}
          />
          <SettingRow
            icon="information-circle"
            name="Sobre a Lumina"
            color="#FF3B30"
            value="v1.0.0"
            onPress={() => {}}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Remover Carteira do Dispositivo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    paddingTop: 80,
    paddingHorizontal: 16,
    paddingBottom: 120, // Espaço para a Tab Bar
  },
  headerTitle: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  group: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "400",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowValue: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 16,
    marginRight: 8,
  },
  logoutButton: {
    marginTop: 10,
    alignItems: "center",
    padding: 16,
  },
  logoutText: {
    color: "#FF453A",
    fontSize: 17,
    fontWeight: "500",
  },
});
