require("dotenv").config();
const API_KEY = process.env.API_KEY;

// Chat container and input elements
const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");

// Helper function to create and display a chat message
const createMessageElement = (text, isUser) => {
  const message = document.createElement("div");
  message.className = isUser ? "user-message" : "ai-message";
  message.textContent = text;
  chatContainer.appendChild(message);
  chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll to the bottom
};

// Cooldown to prevent rapid requests
let isWaiting = false;

// Function to send a message to OpenAI API
const sendMessageToAI = async (userInputText) => {
  if (isWaiting) {
    createMessageElement("Please wait before sending another message.", false);
    return;
  }

  isWaiting = true;
  setTimeout(() => (isWaiting = false), 3000); // 3-second cooldown

  // Display user message
  createMessageElement(userInputText, true);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`, // Replace with your API key
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant created for Ph.D. students specializing in AI and Law. Answer all questions in Persian unless instructed otherwise.",
          },
          { role: "user", content: userInputText },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.error.code === "insufficient_quota") {
        createMessageElement(
          "Error: The AI Assistant has exceeded its current usage quota. Please try again later.",
          false
        );
      } else {
        createMessageElement(
          `Error: ${response.status} - ${errorData.error.message}`,
          false
        );
      }
      return;
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();

    // Display AI response
    createMessageElement(aiResponse, false);
  } catch (error) {
    createMessageElement("Error: Unable to connect to OpenAI.", false);
    console.error(error);
  }
};

// Event listener for "Send" button
sendButton.addEventListener("click", () => {
  const userInputText = userInput.value.trim();
  if (userInputText) {
    sendMessageToAI(userInputText);
    userInput.value = ""; // Clear the input field
  }
});

// Allow "Enter" key to send a message
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendButton.click();
  }
});
