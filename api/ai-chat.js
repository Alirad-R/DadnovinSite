import { OpenAI } from "openai";

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.API_KEY, // Set this in your environment variables
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { message, systemPrompt } = req.body;

  // Validate inputs
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }
  if (!systemPrompt) {
    return res.status(400).json({ error: "System prompt is required" });
  }

  try {
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 1000,
    });

    res
      .status(200)
      .json({ reply: aiResponse.choices[0].message.content.trim() });
  } catch (error) {
    console.error("Error fetching AI response:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
