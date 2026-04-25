import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { fetchMentorChat } from "@/server/gemini-api"; // Ajuste o caminho conforme sua estrutura

export default function MentorScreen() {
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: "Olá, Alexandre. Sou seu Mentor IA. Como posso ajudar você a otimizar sua estratégia Web3 hoje?",
      isUser: false,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Formata o histórico para o formato que a API do Gemini espera (opcional, mas recomendado)
      const chatHistory = messages.slice(1).map((m) => ({
        role: m.isUser ? "user" : "model",
        parts: [{ text: m.text }],
      }));

      const response = await fetchMentorChat(userMessage.text, chatHistory);

      if (response.success) {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: response.answer,
          isUser: false,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error("Resposta inválida da API");
      }
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Desculpe, tive um problema de conexão. Podemos tentar novamente?",
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View
      style={[
        styles.messageBubble,
        item.isUser ? styles.userBubble : styles.aiBubble,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.isUser ? styles.userText : styles.aiText,
        ]}
      >
        {item.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      // keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <LinearGradient
        colors={["#2A1B54", "#080414", "#000000"]}
        locations={[0, 0.4, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Mentor de Cripto</Text>
        <Text style={styles.description}>
          Tire suas dúvidas sobre DeFi, taxas e smart contracts.
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#00E5FF" />
          <Text style={styles.loadingText}>Analisando...</Text>
        </View>
      )}

      <BlurView intensity={60} tint="dark" style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Ex: O que é impermanent loss?"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={300}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && { opacity: 0.5 }]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons name="send" size={20} color="#000" />
        </TouchableOpacity>
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00E5FF",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    color: "#A0A0B0",
  },
  chatContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#00E5FF",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(30, 30, 40, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: "#000",
    fontWeight: "500",
  },
  aiText: {
    color: "#E0E0E0",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  loadingText: {
    color: "#00E5FF",
    fontSize: 12,
    marginLeft: 8,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  textInput: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    color: "#FFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sendButton: {
    backgroundColor: "#00E5FF",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    marginBottom: 2, // Alinha visualmente com o input quando ele cresce
  },
});
