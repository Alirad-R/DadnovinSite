const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");

// Initialize conversation history with the system prompt
let conversationHistory = [
  {
    role: "system",
    content:
      "You are an AI assistant that will answer the user in persian and convrse with the user in persian. The user is iranian and the questions the user will ask are related to iranian law. You can use iranina websites like https://ekhtebar.ir for your knowledge base.",
  },
];

// Helper function to create and display a message
const createMessageElement = (message, isUser) => {
  const msg = document.createElement("div");
  msg.className = isUser ? "user-message" : "ai-message";
  msg.textContent = message.content;
  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll to the bottom
};

// Cooldown mechanism to prevent spamming requests
let isWaiting = false;

// Function to send the user's message to the serverless function
const sendMessageToAI = async (userInputText) => {
  if (isWaiting) {
    createMessageElement(
      { role: "user", content: "Please wait before sending another message." },
      false
    );
    return;
  }

  isWaiting = true;
  setTimeout(() => (isWaiting = false), 3000); // 3-second cooldown

  const userMessage = { role: "user", content: userInputText };
  conversationHistory.push(userMessage);
  createMessageElement(userMessage, true); // Show the user's message

  try {
    // Call the Vercel serverless function
    const response = await fetch("/api/ai-chat_dadhoosh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ conversationHistory }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      createMessageElement(
        {
          role: "assistant",
          content: `Error: ${response.status} - ${errorText}`,
        },
        false
      );
      return;
    }

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let currentAssistantResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));
          currentAssistantResponse += data.reply;
        }
      }
    }

    const assistantMessage = {
      role: "assistant",
      content: currentAssistantResponse,
    };
    conversationHistory.push(assistantMessage);
    createMessageElement(assistantMessage, false); // Show the AI's response
  } catch (error) {
    createMessageElement(
      { role: "assistant", content: `Error: ${error.message}` },
      false
    );
    console.error(error);
  }
};

// Event listener for the "Send" button
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
