const { Configuration, OpenAIApi } = require("openai");

// Configuring OpenAI with API key from environment variables
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Never hard-code sensitive keys
});

const openai = new OpenAIApi(configuration);

// Exporting the serverless function handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body; // Extracting the message from the request body

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Sending the message to OpenAI's API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
      max_tokens: 300,
    });

    // Extracting OpenAI's reply
    const reply = completion.data.choices[0].message.content;

    // Sending the reply back to the frontend
    res.status(200).json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch response from OpenAI API" });
  }
}
