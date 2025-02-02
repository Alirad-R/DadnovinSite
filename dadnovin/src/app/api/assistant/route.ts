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
import { ChatMessageHistory } from "langchain/stores/message/in_memory";

// Registry to store conversation chains in memory.
const conversationRegistry: Record<
  string,
  { chain: ConversationChain; createdAt: number }
> = {};

async function createNewConversationChain(existingHistory: any[] = []) {
  // Create a streaming-enabled LLM.
  const llm = new ChatOpenAI({
    modelName: "deepseek-chat",
    openAIApiKey: process.env.DEEPSEEK_API_KEY,
    configuration: {
      baseURL: "https://api.deepseek.com/v1",
    },
    temperature: 1,
    streaming: true, // Enable streaming for later calls.
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const vectorStore = await loadOrCreateVectorStore(apiKey);

  // Pull the base prompt from LangChain Hub.
  const basePrompt = (await hub.pull(
    "loulou/lil_loulou"
  )) as ChatPromptTemplate;

  // Build a prompt that accepts "history" and "context".
  const promptWithHistory = ChatPromptTemplate.fromMessages([
    ...basePrompt.promptMessages,
    new MessagesPlaceholder("history"),
    ["human", "{context}\n\nQuestion: {question}"],
  ]);

  // Initialize chat history with any existing messages.
  const messageHistory = new ChatMessageHistory();
  for (const msg of existingHistory) {
    if (msg.type === "user") {
      await messageHistory.addUserMessage(msg.content);
    } else {
      await messageHistory.addAIMessage(msg.content);
    }
  }

  // Create a memory object using the chat history.
  const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "history",
    inputKey: "question",
    chatHistory: messageHistory,
  });

  // Create the conversation chain.
  const chain = new ConversationChain({
    llm,
    prompt: promptWithHistory,
    memory,
    verbose: true,
  });

  return { chain, vectorStore };
}

export async function getOrCreateConversation(
  conversationId: string,
  userId: number
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  // Load the conversation history from the database filtering by userId.
  const messages = await prisma.conversation.findMany({
    where: { conversationId, userId },
    orderBy: { createdAt: "asc" },
  });

  const history = messages.map((msg: any) => ({
    type: msg.sender,
    content: msg.message,
  }));

  // Use a combined key for the in-memory conversation registry.
  const conversationKey = `${userId}-${conversationId}`;
  if (conversationRegistry[conversationKey]) {
    const { chain } = conversationRegistry[conversationKey];
    return {
      chain,
      vectorStore: await loadOrCreateVectorStore(apiKey),
    };
  }

  // Otherwise, create a new chain and store it.
  const { chain, vectorStore } = await createNewConversationChain(history);

  conversationRegistry[conversationKey] = {
    chain,
    createdAt: Date.now(),
  };

  return { chain, vectorStore };
}

export async function POST(req: NextRequest) {
  try {
    // Extract the user id from the header. If not present, forbid the request.
    const headerUserId = req.headers.get("x-user-id");
    if (!headerUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(headerUserId);

    const { message, conversationId } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Retrieve the conversation name from the database if it exists (filtered by userId).
    let name =
      (
        await prisma.conversation.findFirst({
          where: { conversationId, userId },
          select: { name: true },
        })
      )?.name || `c${Date.now()}`;

    // Save the user's message to the database.
    await prisma.conversation.create({
      data: {
        userId,
        message,
        sender: "user",
        conversationId,
        name,
      },
    });

    // Retrieve the existing conversation chain from our registry.
    const { chain, vectorStore } = await getOrCreateConversation(
      conversationId,
      userId
    );

    // Get additional context via vectorStore.
    const searchResults = await vectorStore.similaritySearch(message, 5);
    const context = searchResults
      .map((doc: { pageContent: string }) => doc.pageContent)
      .join("\n");

    // Prepare a streaming response.
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendData = (data: string) => {
      writer.write(encoder.encode(`data: ${data}\n\n`));
    };

    const sendEvent = (event: string, data: string) => {
      writer.write(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
    };

    (async () => {
      try {
        let fullResponse = "";

        // Use the existing conversation chain to process the new message.
        await chain.call(
          {
            question: message,
            context: `relevant context: ${context}`,
          },
          {
            callbacks: [
              {
                handleLLMNewToken(token: string) {
                  sendData(JSON.stringify({ data: token }));
                  fullResponse += token;
                },
              },
            ],
          }
        );

        // Signal the end of streaming.
        sendEvent("end", JSON.stringify({ data: "[DONE]" }));
        await writer.ready;
        await writer.close();

        // Save the AI's response to the database.
        await prisma.conversation.create({
          data: {
            userId,
            message: fullResponse,
            sender: "ai",
            conversationId,
            name,
          },
        });
      } catch (error) {
        console.error("Streaming error:", error);
        sendEvent("error", JSON.stringify({ error: "Streaming failed" }));
        await writer.close();
      }
    })();

    return new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    console.error("Error in assistant API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
