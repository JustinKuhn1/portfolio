document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const deepsearchBtn = document.getElementById("deepsearch-btn");
  const thinkBtn = document.getElementById("think-btn");
  const attachBtn = document.getElementById("attach-btn");
  const typingIndicator = document.getElementById("typing-indicator");

  // Check if all elements are found
  if (!chatBox || !chatInput || !chatSend || !deepsearchBtn || !thinkBtn || !attachBtn || !typingIndicator) {
    console.error("One or more DOM elements not found. Check your HTML IDs.");
    return;
  }

  // Add message to chat box
  function addMessage(text, className) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", className);
    messageDiv.innerHTML = `<p>${text}</p>`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom
  }

  // Simulated AI response (replace with real API later)
  async function fetchAIResponse(userInput, mode = "default") {
    return new Promise((resolve) => {
      let response = `You said: "${userInput}". `;
      if (mode === "deepsearch") response += "Performing a deep search...";
      else if (mode === "think") response += "Thinking deeply...";
      else response += "How can I help you further?";
      setTimeout(() => resolve(response), 1000); // Simulated delay
    });
  }

  // Handle sending message (shared logic for send/deepsearch/think)
  function handleMessage(mode = "default") {
    const messageText = chatInput.value.trim();
    if (!messageText) {
      console.log("Input is empty, ignoring.");
      return;
    }

    addMessage(messageText, "user-message");
    chatInput.value = "";
    chatSend.disabled = true;
    typingIndicator.style.display = "flex";

    fetchAIResponse(messageText, mode)
      .then((response) => {
        addMessage(response, "ai-message");
        typingIndicator.style.display = "none";
        chatSend.disabled = !chatInput.value.trim();
      })
      .catch((error) => {
        console.error("Error fetching response:", error);
        addMessage("Oops, something went wrong!", "ai-message");
        typingIndicator.style.display = "none";
        chatSend.disabled = !chatInput.value.trim();
      });
  }

  // Event listeners for buttons
  chatSend.addEventListener("click", () => {
    console.log("Send button clicked");
    handleMessage("default");
  });

  deepsearchBtn.addEventListener("click", () => {
    console.log("Deepsearch button clicked");
    handleMessage("deepsearch");
  });

  thinkBtn.addEventListener("click", () => {
    console.log("Think button clicked");
    handleMessage("think");
  });

  attachBtn.addEventListener("click", () => {
    console.log("Attach button clicked");
    addMessage("Attach feature coming soon!", "ai-message");
  });

  // Input handling
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      console.log("Enter key pressed");
      handleMessage("default");
    }
  });

  chatInput.addEventListener("input", () => {
    chatSend.disabled = !chatInput.value.trim();
  });

  // Initial setup
  chatSend.disabled = true;
  console.log("Chat script initialized successfully");
});