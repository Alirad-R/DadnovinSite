"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { v4 as uuidv4 } from "uuid";

export default function DadafarinAssistant() {
  const [messages, setMessages] = useState<
    Array<{ type: "user" | "ai"; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState<string>(uuidv4());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

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
    </section>
  );
}
