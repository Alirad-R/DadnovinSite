"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { v4 as uuidv4 } from "uuid";
import ConversationList from "@/components/ConversationList";
import ChatWindow from "@/components/ChatWindow";

export default function DadafarinAssistant() {
  const { user } = useAuth();

  // Wait until the user is available before rendering.
  if (!user) {
    return <div>Loading...</div>;
  }

  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [conversationList, setConversationList] = useState<any[]>([]);

  // When a conversation is set, initialize its chain once.
  useEffect(() => {
    if (currentConversationId) {
      fetch("/api/assistant/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id.toString(),
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
  }, [currentConversationId, user]);

  // Load conversation list on mount.
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/conversations", {
          headers: { "x-user-id": user.id.toString() },
        });
        const data = await res.json();
        setConversationList(data);
      } catch (error) {
        console.error("Error fetching conversation list:", error);
      }
    };
    fetchConversations();
  }, [user]);

  // When selecting a conversation, update state.
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setCurrentConversationId(conversationId);
    setIsNewConversation(false);
  };

  // Delete a conversation.
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/conversations?conversationId=${conversationId}`,
        {
          method: "DELETE",
          headers: { "x-user-id": user.id.toString() },
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
          />
        </div>
      </div>
    </div>
  );
}
