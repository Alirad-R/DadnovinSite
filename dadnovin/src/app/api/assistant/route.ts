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

// Registry to store conversation chains
const conversationRegistry: Record<string, ConversationChain> = {};

async function createNewConversationChain() {
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

  const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "history",
    inputKey: "question",
  });

  const chain = new ConversationChain({
    llm,
    prompt: promptWithHistory, // Use the modified prompt template
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

  if (conversationRegistry[conversationId]) {
    const chain = conversationRegistry[conversationId];
    const vectorStore = await loadOrCreateVectorStore(apiKey);
    return { chain, vectorStore };
  }

  const { chain, vectorStore } = await createNewConversationChain();
  conversationRegistry[conversationId] = chain;
  return { chain, vectorStore };
}

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId } = await req.json();

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

    return NextResponse.json({ response: response.response });
  } catch (error) {
    console.error("Error in assistant API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
