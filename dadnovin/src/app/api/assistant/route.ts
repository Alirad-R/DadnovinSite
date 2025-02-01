import { ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import * as hub from "langchain/hub";
import { BufferMemory } from "langchain/memory";
import { NextRequest, NextResponse } from "next/server";
import { loadOrCreateVectorStore } from "../../../lib/vectorStoreManager";
import prisma from "@/lib/prisma";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";

// Registry to store conversation chains
const conversationRegistry: Record<
  string,
  { chain: ConversationChain; createdAt: number }
> = {};

async function createNewConversationChain(existingHistory: any[] = []) {
  const llm = new ChatOpenAI({
    modelName: "deepseek-chat",
    openAIApiKey: process.env.DEEPSEEK_API_KEY,
    configuration: {
      baseURL: "https://api.deepseek.com/v1",
    },
    temperature: 1,
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const vectorStore = await loadOrCreateVectorStore(apiKey);

  // Get the base prompt
  const basePrompt = (await hub.pull(
    "loulou/lil_loulou"
  )) as ChatPromptTemplate;

  // Build a new prompt template that includes "history" and "context"
  const promptWithHistory = ChatPromptTemplate.fromMessages([
    ...basePrompt.promptMessages,
    new MessagesPlaceholder("history"),
    ["human", "{context}\n\nQuestion: {question}"],
  ]);

  // Initialize chat history with existing messages
  const messageHistory = new ChatMessageHistory();
  for (const msg of existingHistory) {
    if (msg.type === "user") {
      await messageHistory.addUserMessage(msg.content);
    } else {
      await messageHistory.addAIMessage(msg.content);
    }
  }

  // Create memory with initialized history
  const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "history",
    inputKey: "question",
    chatHistory: messageHistory,
  });

  // Create chain with memory
  const chain = new ConversationChain({
    llm,
    prompt: promptWithHistory,
    memory,
    verbose: true,
  });

  return { chain, vectorStore };
}

async function getOrCreateConversation(conversationId: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  // Fetch conversation history from database
  const messages = await prisma.conversation.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });

  const history = messages.map((msg) => ({
    type: msg.sender,
    content: msg.message,
  }));

  // Return existing chain with its memory
  if (conversationRegistry[conversationId]) {
    const { chain } = conversationRegistry[conversationId];
    return {
      chain,
      vectorStore: await loadOrCreateVectorStore(apiKey),
    };
  }

  // Create new chain with history from database
  const { chain, vectorStore } = await createNewConversationChain(history);

  conversationRegistry[conversationId] = {
    chain,
    createdAt: Date.now(),
  };

  return { chain, vectorStore };
}

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId, isNewConversation } = await req.json();
    const userId = 1; // From auth

    // Generate name only for new conversations
    const name = isNewConversation
      ? `c${Date.now()}`
      : (
          await prisma.conversation.findFirst({
            where: { conversationId },
            select: { name: true },
          })
        )?.name || `c${Date.now()}`;

    // Create message entries with the same name
    await prisma.conversation.create({
      data: {
        userId,
        message,
        sender: "user",
        conversationId,
        name,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const { chain, vectorStore } = await getOrCreateConversation(
      conversationId
    );
    const searchResults = await vectorStore.similaritySearch(message, 5);
    const context = searchResults
      .map((doc: { pageContent: string }) => doc.pageContent)
      .join("\n");

    // Get response from the chain
    const response = await chain.invoke({
      question: message,
      context: `relevant context: ${context}`,
    });

    // After AI response
    await prisma.conversation.create({
      data: {
        userId,
        message: response.response,
        sender: "ai",
        conversationId,
        name,
      },
    });

    return NextResponse.json({ response: response.response });
  } catch (error) {
    console.error("Error in assistant API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
