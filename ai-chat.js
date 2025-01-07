const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");

// Helper function to create and display a message
const createMessageElement = (text, isUser) => {
  const message = document.createElement("div");
  message.className = isUser ? "user-message" : "ai-message";
  message.textContent = text;
  chatContainer.appendChild(message);
  chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll to the bottom
};

// Cooldown mechanism to prevent spamming requests
let isWaiting = false;

// Function to send the user's message to the serverless function
const sendMessageToAI = async (userInputText) => {
  if (isWaiting) {
    createMessageElement("Please wait before sending another message.", false);
    return;
  }

  isWaiting = true;
  setTimeout(() => (isWaiting = false), 3000); // 3-second cooldown

  createMessageElement(userInputText, true); // Show the user's message

  try {
    // Call the Vercel serverless function
    const response = await fetch("/api/ai-chat_dadhoosh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userInputText }),
    });

    const rawResponse = await response.text(); // Log raw response
    console.log("Raw response:", rawResponse);

    if (!response.ok) {
      createMessageElement(`Error: ${response.status} - ${rawResponse}`, false);
      return;
    }

    const data = JSON.parse(rawResponse); // Parse the response JSON
    const aiResponse = data.reply.trim();
    createMessageElement(aiResponse, false); // Show the AI's response
  } catch (error) {
    createMessageElement(`Error: ${error.message}`, false);
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
