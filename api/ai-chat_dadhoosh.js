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
      model: "gpt-4", // You can switch models if needed
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that will answer the user in persian and convrse with the user in persian. The user is iranian and the questions the user will ask are related to iranian law. You can use iranina websites like https://ekhtebar.ir for your knowledge base.",
        },
        { role: "user", content: message },
      ],
      max_tokens: 800,
    });

    const reply = aiResponse.choices[0].message?.content
      ?.trim()
      .replace(/[\u200B-\u200D\uFEFF]/g, "");

    console.log("AI Response:", aiResponse);
    console.log("Reply to Client:", reply);

    if (!reply) {
      return res.status(500).json({ error: "No valid response from AI" });
    }

    // Send the AI response back as JSON
    return res
      .status(200)
      .setHeader("Content-Type", "application/json; charset=utf-8")
      .json({ reply: aiResponse.choices[0].message?.content?.trim() });
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
