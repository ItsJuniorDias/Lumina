// services/api.js
export const API_BASE_URL = "https://blogclub.dev.br/api";

export const fetchMarketInsight = async (topCoinsData, ethGasPrice) => {
  const response = await fetch(`${API_BASE_URL}/market-insight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topCoinsData, ethGasPrice }),
  });
  return response.json();
};

export const fetchTxExplainer = async (txData, contractAddress, network) => {
  const response = await fetch(`${API_BASE_URL}/tx-explainer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txData, contractAddress, network }),
  });
  return response.json();
};

export const fetchMentorChat = async (userQuestion, chatHistory) => {
  const response = await fetch(`${API_BASE_URL}/mentor-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userQuestion, chatHistory }),
  });
  return response.json();
};
