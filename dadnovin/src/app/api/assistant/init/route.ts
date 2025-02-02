import { NextRequest, NextResponse } from "next/server";
import { getOrCreateConversation } from "@/app/api/assistant/route"; // adjust the relative import if needed

export async function POST(req: NextRequest) {
  try {
    const { conversationId } = await req.json();
    // If no conversationId is provided, the client should generate one.
    const id = conversationId; 

    // This call will load all previous messages from the DB (if any)
    // and create (or return an existing) conversation chain stored in memory.
    await getOrCreateConversation(id);

    return NextResponse.json({
      conversationId: id,
      message: "Conversation initialized.",
    });
  } catch (error) {
    console.error("Error in conversation initialization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
