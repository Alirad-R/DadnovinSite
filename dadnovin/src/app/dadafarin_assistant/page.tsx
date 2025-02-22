"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { v4 as uuidv4 } from "uuid";
import dynamic from "next/dynamic";

// Dynamically import components that use localStorage with ssr disabled
const ConversationList = dynamic(
  () => import("@/components/ConversationList"),
  {
    ssr: false,
  }
);

const ChatWindow = dynamic(() => import("@/components/ChatWindow"), {
  ssr: false,
});

export default function DadafarinAssistant() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [conversationList, setConversationList] = useState<any[]>([]);

  // Get token on client side
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  // When a conversation is set, initialize its chain once.
  useEffect(() => {
    if (currentConversationId && user && token) {
      fetch("/api/assistant/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId: currentConversationId }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Conversation initialized:", data);
        })
        .catch((err) =>
          console.error("Failed to initialize conversation:", err)
        );
    }
  }, [currentConversationId, user, token]);

  // Function to fetch conversation list.
  const fetchConversations = useCallback(async () => {
    if (user && token) {
      try {
        const res = await fetch("/api/conversations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setConversationList(data);
      } catch (error) {
        console.error("Error fetching conversation list:", error);
      }
    }
  }, [user, token]);

  // Load conversation list on mount.
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // When selecting a conversation, update state.
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setCurrentConversationId(conversationId);
    setIsNewConversation(false);
  };

  // Delete a conversation.
  const handleDeleteConversation = async (conversationId: string) => {
    if (!user || !token) return;
    try {
      const response = await fetch(
        `/api/conversations?conversationId=${conversationId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        setConversationList((prev) =>
          prev.filter((conv) => conv.conversationId !== conversationId)
        );
        if (selectedConversation === conversationId) {
          setSelectedConversation(null);
          setCurrentConversationId(null);
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  // Create a new conversation.
  const handleNewConversation = () => {
    const newId = uuidv4();
    setCurrentConversationId(newId);
    setIsNewConversation(true);
    setSelectedConversation(null);
  };

  // If user is not loaded yet, show loading state
  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <h1
        className="text-3xl font-bold text-center py-6"
        style={{ color: "var(--foreground)" }}
      >
        دستیار هوش مصنوعی
      </h1>
      <div className="flex flex-1 overflow-hidden">
        <ConversationList
          conversationList={conversationList}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onNewConversation={handleNewConversation}
        />
        <div className="flex-1 flex flex-col">
          <ChatWindow
            conversationId={currentConversationId}
            isNewConversation={isNewConversation}
            onAutoNewConversation={handleNewConversation}
            refreshConversationList={fetchConversations}
          />
        </div>
      </div>
    </div>
  );
}
