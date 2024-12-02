import { OpenAI } from "openai";

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.API_KEY, // Use the API key from environment variables
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { message } = req.body;

    try {
      // Call OpenAI API to get the AI's response
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Or another model you prefer
        messages: [{ role: "user", content: message }],
        max_tokens: 150,
      });

      // Send the response back to the client
      res
        .status(200)
        .json({ reply: aiResponse.choices[0].message.content.trim() });
    } catch (error) {
      console.error("Error fetching AI response:", error);
      res.status(500).json({ error: "Error with OpenAI API" });
    }
  } else {
    // Only allow POST requests
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
