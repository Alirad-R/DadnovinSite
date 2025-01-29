"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

export default function DadafarinAssistant() {
  const [messages, setMessages] = useState<
    Array<{ type: "user" | "ai"; content: string }>
  >([]);
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { type: "user", content: input }]);

    // TODO: Add actual AI integration here
    // For now, just echo back a response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { type: "ai", content: "This is a sample AI response." },
      ]);
    }, 1000);

    setInput("");
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
          />
          <button
            type="submit"
            className="px-5 py-3 bg-blue-600 text-white rounded-l-lg hover:bg-blue-700 transition-colors"
          >
            ارسال
          </button>
        </form>
      </div>
    </section>
  );
}
