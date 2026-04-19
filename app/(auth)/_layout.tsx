import React from "react";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AuthLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        // Fundo da Tab Bar usando Glassmorphism
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.4)",
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      {/* Tela do Dashboard (A sua tela principal) */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Carteira",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "wallet" : "wallet-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Tela de Ajustes */}
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    borderTopWidth: StyleSheet.hairlineWidth, // Borda ultra fina
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    elevation: 0,
    backgroundColor: "transparent",
    height: Platform.OS === "ios" ? 88 : 70, // Mais alto no iOS para a Safe Area
    paddingBottom: Platform.OS === "ios" ? 28 : 10,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
});
