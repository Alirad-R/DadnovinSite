import { ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { BufferMemory } from "langchain/memory";
import { NextRequest, NextResponse } from "next/server";

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

  const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful AI assistant."],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
  ]);

  const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "history",
    inputKey: "input",
  });

  const chain = new ConversationChain({
    llm,
    prompt: promptTemplate,
    memory,
    verbose: true,
  });

  return chain;
}

async function getOrCreateConversation(conversationId: string) {
  if (conversationRegistry[conversationId]) {
    return conversationRegistry[conversationId];
  }

  const chain = await createNewConversationChain();
  conversationRegistry[conversationId] = chain;
  return chain;
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

    const chain = await getOrCreateConversation(conversationId);

    // Get response from the chain
    const response = await chain.invoke({
      input: message,
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
