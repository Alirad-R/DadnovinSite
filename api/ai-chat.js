import { OpenAI } from "openai";

// Initialize OpenAI with your API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { message } = req.body;

  // Check if the message exists in the request body
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Get AI response from OpenAI API
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Or another model of your choice
      messages: [{ role: "user", content: message }],
      max_tokens: 150,
    });

    // Send the AI response back as JSON
    return res
      .status(200)
      .json({ reply: aiResponse.choices[0].message.content.trim() });
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return res.status(500).json({ error: "Error with OpenAI API" });
  }
}
