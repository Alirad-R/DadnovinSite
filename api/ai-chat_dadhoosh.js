import { OpenAI } from "openai";

// Initialize OpenAI with your API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.API_KEY, // Make sure this is set correctly in your environment
});

export default async function handler(req, res) {
  // Ensure it's a POST request
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { message } = req.body;

  // Check if the message is provided in the request body
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Make the OpenAI API request
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo", // You can switch models if needed
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant created for Ph.D. students specializing in AI and Law. Answer all questions in Persian unless instructed otherwise.",
        },
        { role: "user", content: message },
      ],
      max_tokens: 1000,
    });

    // Send the AI response back as JSON
    return res
      .status(200)
      .json({ reply: aiResponse.choices[0].message.content.trim() });
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
