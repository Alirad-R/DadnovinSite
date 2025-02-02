"use client";

import React from "react";

interface Conversation {
  conversationId: string;
  name: string;
  createdAt: string;
}

interface ConversationListProps {
  conversationList: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

export default function ConversationList({
  conversationList,
  selectedConversation,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
}: ConversationListProps) {
  return (
    <div className="w-1/4 flex flex-col border-r" style={{ background: "var(--card-background)" }}>
      <h2 className="text-xl font-bold p-4" style={{ color: "var(--foreground)" }}>
        Conversations
      </h2>

      {/* List of conversations */}
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
            <div className="cursor-pointer flex-grow" onClick={() => onSelectConversation(conv.conversationId)}>
              {conv.name}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConversation(conv.conversationId);
              }}
              className="text-red-500 hover:text-red-700 px-2"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* New Conversation Button */}
      <div className="p-4">
        <button onClick={onNewConversation} className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          New Conversation
        </button>
      </div>
    </div>
  );
}
