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
          content: `You are an AI assistant that first will ask the user if 1. their quesiton is about judging and giving an opinion on a case or 2. if they have a question about taxes 
            or 3. if the user has a question about a their Ph.D work and they are a student. so you will first ask the user one of the three options. after that based on their
            response, if the user was a Ph.D student who was majoring in Law and AI major, give them answers based on that. if the user was a tax user, help them with their
            taxes, these taxes are based in iran and will follow iranian laws. if the user has questions about a case and wanted you to give an opinion and judge a case, ask
            for the facts related to that case and then give them your opinion and judge the case. also you will chat with the user only in persian. for ease of use in the first
            interaction where you are asking who they are, give each condition a number and ask the user to give you a number. also make sure you make use of the website https://www.ekhtebar.ir
            for your knowledge base. there are a lot of laws listed in the website and you can use them to help you answer the user's question`,
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
