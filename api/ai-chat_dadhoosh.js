import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Your system prompt here." },
        { role: "user", content: message },
      ],
      max_tokens: 800,
      stream: true,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of aiResponse) {
      const content = chunk.choices[0]?.delta?.content || "";
      res.write(`data: ${JSON.stringify({ reply: content })}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
