const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");

const createMessageElement = (text, isUser) => {
  const message = document.createElement("div");
  message.className = isUser ? "user-message" : "ai-message";
  message.textContent = text;
  chatContainer.appendChild(message);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return message;
};

let isWaiting = false;

const sendMessageToAI = async (userInputText) => {
  if (isWaiting) {
    createMessageElement("Please wait before sending another message.", false);
    return;
  }

  isWaiting = true;
  setTimeout(() => (isWaiting = false), 5000);

  createMessageElement(userInputText, true);

  try {
    const response = await fetch("/api/ai-chat_dadhoosh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userInputText }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      createMessageElement(`Error: ${response.status} - ${errorText}`, false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiMessageElement = createMessageElement("", false);
    let accumulatedResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));
          accumulatedResponse += data.reply;
          aiMessageElement.textContent = accumulatedResponse;
        }
      }
    }
  } catch (error) {
    createMessageElement(`Error: ${error.message}`, false);
    console.error(error);
  }
};

sendButton.addEventListener("click", () => {
  const userInputText = userInput.value.trim();
  if (userInputText) {
    sendMessageToAI(userInputText);
    userInput.value = "";
  }
});

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendButton.click();
  }
});
