import React, { useEffect } from "react";
import { StyleSheet, Text, View, Dimensions, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Accelerometer } from "expo-sensors";

const { width } = Dimensions.get("window");

interface Props {
  balance: string;
  isLoading: boolean;
}

export default function InteractiveBalanceCard({ balance, isLoading }: Props) {
  const pitch = useSharedValue(0);
  const roll = useSharedValue(0);

  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(16);

    const sub = Accelerometer.addListener(({ x, y }) => {
      pitch.value = withSpring(y, { damping: 25, stiffness: 120 });
      roll.value = withSpring(x, { damping: 25, stiffness: 120 });
    });

    return () => sub.remove();
  }, []);

  // 🎯 ROTAÇÃO PRINCIPAL (card inteiro)
  const cardStyle = useAnimatedStyle(() => {
    const rotateX = interpolate(pitch.value, [-0.6, 0.6], [20, -20]);
    const rotateY = interpolate(roll.value, [-0.6, 0.6], [-20, 20]);

    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${rotateX}deg` },
        { rotateY: `${rotateY}deg` },
      ],
    };
  });

  // 🧠 PARALLAX (conteúdo mais próximo)
  const contentStyle = useAnimatedStyle(() => {
    const translateX = interpolate(roll.value, [-1, 1], [-10, 10]);
    const translateY = interpolate(pitch.value, [-1, 1], [-10, 10]);

    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  // 💡 REFLEXO DINÂMICO (efeito vidro)
  const shineStyle = useAnimatedStyle(() => {
    const translateX = interpolate(roll.value, [-1, 1], [-120, 120]);
    const translateY = interpolate(pitch.value, [-1, 1], [-120, 120]);

    return {
      transform: [{ translateX }, { translateY }],
      opacity: 0.25,
    };
  });

  // ✨ GLOW INTELIGENTE
  const glowStyle = useAnimatedStyle(() => {
    const translateX = interpolate(roll.value, [-1, 1], [-50, 50]);
    const translateY = interpolate(pitch.value, [-1, 1], [-50, 50]);

    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  // 👉 interação por toque
  const handleTouch = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;

    touchX.value = locationX;
    touchY.value = locationY;
  };

  return (
    <View style={styles.container}>
      <Pressable onPressIn={handleTouch}>
        <Animated.View style={[styles.cardWrapper, cardStyle]}>
          <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
            {/* brilho glass */}
            <Animated.View style={[styles.shine, shineStyle]} />

            {/* glow */}
            <Animated.View style={[styles.glow, glowStyle]} />

            {/* conteúdo com parallax */}
            <Animated.View style={contentStyle}>
              <Text style={styles.balanceLabel}>Saldo Total Estimado</Text>

              <Text style={styles.balanceValue}>
                {isLoading ? "---" : `R$ ${balance}`}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.walletAddress}>Lumina Trade</Text>
                <Ionicons
                  name="wallet-outline"
                  size={16}
                  color="rgba(255,255,255,0.6)"
                />
              </View>
            </Animated.View>
          </BlurView>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 30,
  },

  cardWrapper: {
    width: width - 40,
    height: 190,
    borderRadius: 30,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 15,
  },

  blurContainer: {
    flex: 1,
    borderRadius: 30,
    padding: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
  },

  shine: {
    position: "absolute",
    width: 200,
    height: 200,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 100,
    top: -80,
    left: -80,
  },

  glow: {
    position: "absolute",
    width: 180,
    height: 180,
    backgroundColor: "rgba(120,120,255,0.25)",
    borderRadius: 90,
    top: -60,
    left: -60,
  },

  balanceLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginBottom: 8,
  },

  balanceValue: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "700",
    marginBottom: 20,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    alignSelf: "flex-start",
  },

  walletAddress: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginRight: 8,
  },
});
