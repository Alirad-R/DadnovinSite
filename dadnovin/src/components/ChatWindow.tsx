"use client";

import React, { useState, useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";

interface ChatWindowProps {
  conversationId: string | null;
  isNewConversation: boolean;
  onAutoNewConversation: () => void;
  refreshConversationList: () => void;
}

export default function ChatWindow({
  conversationId,
  isNewConversation,
  onAutoNewConversation,
  refreshConversationList,
}: ChatWindowProps) {
  const { messages, isLoading, sendMessage } = useChat({
    conversationId,
    isNewConversation,
  });
  const [input, setInput] = useState("");
  const [optimisticMessage, setOptimisticMessage] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (conversationId && optimisticMessage) {
      (async () => {
        await sendMessage(optimisticMessage);
        setOptimisticMessage("");
        setIsCreating(false);
        if (isNewConversation) {
          refreshConversationList();
        }
      })();
    }
  }, [
    conversationId,
    optimisticMessage,
    sendMessage,
    isNewConversation,
    refreshConversationList,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (!conversationId) {
      setOptimisticMessage(input);
      setIsCreating(true);
      onAutoNewConversation();
    } else {
      sendMessage(input);
    }
    setInput("");
  };

  // Compute the messages to display:
  const displayMessages = conversationId
    ? messages
    : optimisticMessage
    ? [
        { type: "user", content: optimisticMessage },
        { type: "ai", content: "Creating new conversation..." },
      ]
    : isCreating
    ? [{ type: "ai", content: "Creating new conversation..." }]
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div
        className="flex-1 p-4 overflow-y-auto"
        style={{ background: "var(--card-background)" }}
      >
        {displayMessages.map((message, i) => (
          <div
            key={i}
            className={`my-2 p-3 rounded-lg max-w-[70%] ${
              message.type === "user"
                ? "text-right text-white bg-blue-600 ml-auto"
                : "text-left mr-auto"
            }`}
            style={
              message.type === "ai"
                ? {
                    backgroundColor: "var(--input-background)",
                    color: "var(--foreground)",
                  }
                : {}
            }
          >
            {message.content}
          </div>
        ))}
        {isLoading && <div className="text-center p-2">Loading...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="p-4 border-t"
        style={{ background: "var(--card-background)" }}
      >
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-3 text-base border rounded-r-lg outline-none"
            style={{
              background: "var(--input-background)",
              borderColor: "var(--input-border)",
              color: "var(--input-text)",
            }}
            placeholder="پیام خود را تایپ کنید"
            dir="rtl"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-5 py-3 bg-blue-600 text-white rounded-l-lg hover:bg-blue-700 transition-colors"
            disabled={isLoading}
          >
            ارسال
          </button>
        </form>
      </div>
    </div>
  );
}
