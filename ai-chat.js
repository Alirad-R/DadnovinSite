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
  try {
    const response = await fetch(
      "https://your-serverless-endpoint.com/api/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInputText }),
      }
    );

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    createMessageElement(aiResponse, false);
  } catch (error) {
    createMessageElement("Error: " + error.message, false);
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
