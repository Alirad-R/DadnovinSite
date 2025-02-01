"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { v4 as uuidv4 } from "uuid";

export default function DadafarinAssistant() {
  const [messages, setMessages] = useState<
    Array<{ type: "user" | "ai"; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [conversationList, setConversationList] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Generate new ID and name only for new conversations
    let conversationId = currentConversationId;
    let isNew = false;

    if (!conversationId) {
      conversationId = uuidv4();
      setCurrentConversationId(conversationId);
      isNew = true;
    }

    setIsLoading(true);
    // Add user message
    setMessages((prev) => [...prev, { type: "user", content: input }]);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          conversationId,
          isNewConversation: isNew, // Tell the API this is a new conversation
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      setMessages((prev) => [...prev, { type: "ai", content: data.response }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { type: "ai", content: "An error occurred. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setCurrentConversationId(conversationId);
    setIsNewConversation(false);
  };

  useEffect(() => {
    const fetchConversations = async () => {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      setConversationList(data);
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      const loadMessages = async () => {
        const res = await fetch(
          `/api/conversations?conversationId=${selectedConversation}`
        );
        const data = await res.json();
        setMessages(
          data.map((msg: any) => ({
            type: msg.sender === "user" ? "user" : "ai",
            content: msg.message,
          }))
        );
      };
      loadMessages();
    }
  }, [selectedConversation]);

  return (
    <section
      className="ai-container min-h-screen"
      style={{ background: "var(--background)" }}
    >
      <Navbar />
      <h1
        className="text-3xl font-bold text-center py-6"
        style={{ color: "var(--foreground)" }}
      >
        دستیار هوش مصنوعی
      </h1>

      <div className="flex h-screen">
        <div
          className="w-1/4 border-r p-4"
          style={{ background: "var(--card-background)" }}
        >
          <h2 className="text-xl font-bold mb-4">Conversations</h2>
          {conversationList.map((conv) => (
            <div
              key={conv.conversationId}
              onClick={() => handleSelectConversation(conv.conversationId)}
              className={`p-2 mb-2 cursor-pointer rounded ${
                selectedConversation === conv.conversationId
                  ? "bg-blue-100"
                  : "hover:bg-gray-100"
              }`}
            >
              {conv.name}
            </div>
          ))}
          <button
            onClick={() => {
              setCurrentConversationId(null);
              setIsNewConversation(true);
              setMessages([]);
            }}
            className="mb-4 p-2 bg-blue-500 text-white rounded"
          >
            New Conversation
          </button>
        </div>

        <div className="w-3/4 p-4">
          <div
            id="chat-container"
            className="w-4/5 mx-auto p-5 border rounded-lg overflow-y-auto"
            style={{
              background: "var(--card-background)",
              borderColor: "var(--card-border)",
              maxHeight: "60vh",
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
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
          </div>

          <div className="chat-input-container w-4/5 mx-auto flex justify-center mt-5">
            <form onSubmit={handleSubmit} className="flex w-full">
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
      </div>
    </section>
  );
}
