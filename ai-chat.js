// ai-chat.js
const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");

let conversationHistory = [
  {
    role: "system",
    content:
      "You are an AI assistant that will answer the user in persian and convrse with the user in persian. The user is iranian and the questions the user will ask are related to iranian law. You can use iranina websites like https://ekhtebar.ir for your knowledge base.",
  },
];

let isWaiting = false;
let assistantMessageElement = null;

const createMessageElement = (message, isUser) => {
  const msg = document.createElement("div");
  msg.className = isUser ? "user-message" : "ai-message";
  msg.textContent = message.content;
  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return msg;
};

const sendMessageToAI = async (userInputText) => {
  if (isWaiting) {
    createMessageElement(
      { role: "user", content: "Please wait before sending another message." },
      false
    );
    return;
  }

  isWaiting = true;
  setTimeout(() => (isWaiting = false), 3000);

  const userMessage = { role: "user", content: userInputText };
  conversationHistory.push(userMessage);
  createMessageElement(userMessage, true);

  try {
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

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let currentAssistantResponse = "";
    assistantMessageElement = createMessageElement(
      { role: "assistant", content: "" },
      false
    );

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));
          currentAssistantResponse += data.reply;
          if (assistantMessageElement) {
            assistantMessageElement.textContent = currentAssistantResponse;
          }
        }
      }
    }

    conversationHistory[conversationHistory.length - 1].content =
      currentAssistantResponse;
  } catch (error) {
    createMessageElement(
      { role: "assistant", content: `Error: ${error.message}` },
      false
    );
    console.error(error);
  } finally {
    isWaiting = false;
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
