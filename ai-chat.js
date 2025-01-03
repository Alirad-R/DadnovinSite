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

// Track the current system prompt
let systemPrompt = "";

// Function to send the user's message to the serverless function
const sendMessageToAI = async (userInputText) => {
  if (isWaiting) {
    createMessageElement("Please wait before sending another message.", false);
    return;
  }

  if (!systemPrompt) {
    createMessageElement(
      "Please select a topic from the navigation bar.",
      false
    );
    return;
  }

  isWaiting = true;
  setTimeout(() => (isWaiting = false), 3000); // 3-second cooldown

  createMessageElement(userInputText, true); // Show the user's message

  try {
    // Call the serverless function
    const response = await fetch("/api/ai-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userInputText, systemPrompt }),
    });

    if (!response.ok) {
      const errorData = await response.json(); // Parse error response
      createMessageElement(
        `Error: ${response.status} - ${
          errorData.error || "Something went wrong"
        }`,
        false
      );
      return;
    }

    const data = await response.json(); // Parse the response once
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

// Handle system prompt updates based on navbar clicks
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault(); // Prevent default link behavior
    systemPrompt = item.getAttribute("data-prompt");
    chatContainer.innerHTML = ""; // Clear chat history
    alert(`System Prompt Set: ${systemPrompt}`);
  });
});
