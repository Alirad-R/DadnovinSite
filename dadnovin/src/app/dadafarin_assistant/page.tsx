"use client";

import { useState, useEffect, useRef } from "react";
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userInput = input; // Store input before clearing
    setInput(""); // Clear input immediately

    // Generate new ID and name only for new conversations
    let conversationId = currentConversationId;
    let isNew = false;

    if (!conversationId) {
      conversationId = uuidv4();
      setCurrentConversationId(conversationId);
      isNew = true;
      // Add new conversation to list immediately
      const newConversation = {
        conversationId,
        name: `c${Date.now()}`,
        createdAt: new Date(),
      };
      setConversationList((prev) => [newConversation, ...prev]);
    }

    setIsLoading(true);
    // Add user message
    setMessages((prev) => [...prev, { type: "user", content: userInput }]);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userInput,
          conversationId,
          isNewConversation: isNew,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = response.body;
      if (!data) {
        throw new Error("No data returned");
      }

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiResponse = "";

      setMessages((prev) => [...prev, { type: "ai", content: "" }]);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);

        const lines = chunkValue.split("\n");
        for (const line of lines) {
          if (line.startsWith("data:")) {
            const jsonString = line.substring(5).trim();
            if (jsonString !== "") {
              const { data } = JSON.parse(jsonString);
              if (data !== "[DONE]") {
                aiResponse += data;
                setMessages((prev) => {
                  const lastMessage = prev[prev.length - 1];
                  const updatedMessage = {
                    ...lastMessage,
                    content: lastMessage.content + data,
                  };
                  return [...prev.slice(0, -1), updatedMessage];
                });
              } else {
                done = true;
              }
            }
          } else if (line.startsWith("event: end")) {
            done = true;
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { type: "ai", content: "An error occurred. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setCurrentConversationId(conversationId);
    setIsNewConversation(false);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/conversations?conversationId=${conversationId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setConversationList((prev) =>
          prev.filter((conv) => conv.conversationId !== conversationId)
        );

        if (selectedConversation === conversationId) {
          setSelectedConversation(null);
          setCurrentConversationId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
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
    <div className="flex flex-col h-screen">
      <Navbar />
      <h1
        className="text-3xl font-bold text-center py-6"
        style={{ color: "var(--foreground)" }}
      >
        دستیار هوش مصنوعی
      </h1>

      <div className="flex flex-1 overflow-hidden">
        <div
          className="w-1/4 flex flex-col border-r"
          style={{ background: "var(--card-background)" }}
        >
          <h2
            className="text-xl font-bold p-4"
            style={{ color: "var(--foreground)" }}
          >
            Conversations
          </h2>

          <div className="flex-1 overflow-y-auto p-4">
            {conversationList.map((conv) => (
              <div
                key={conv.conversationId}
                className="flex justify-between items-center p-2 mb-2 rounded hover:bg-opacity-10 hover:bg-gray-300"
                style={{
                  backgroundColor:
                    selectedConversation === conv.conversationId
                      ? "var(--selection-background, rgba(59, 130, 246, 0.1))"
                      : "transparent",
                  color: "var(--foreground)",
                }}
              >
                <div
                  className="cursor-pointer flex-grow"
                  onClick={() => handleSelectConversation(conv.conversationId)}
                >
                  {conv.name}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv.conversationId);
                  }}
                  className="text-red-500 hover:text-red-700 px-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="p-4">
            <button
              onClick={() => {
                setCurrentConversationId(null);
                setIsNewConversation(true);
                setSelectedConversation(null);
                setMessages([]);
              }}
              className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              New Conversation
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div
            id="chat-container"
            className="flex-1 p-4 overflow-y-auto"
            style={{
              background: "var(--card-background)",
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
            <div ref={messagesEndRef} />
          </div>

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
      </div>
    </div>
  );
}
