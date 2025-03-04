document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const deepsearchBtn = document.getElementById("deepsearch-btn");
  const thinkBtn = document.getElementById("think-btn");
  const attachBtn = document.getElementById("attach-btn");
  const typingIndicator = document.getElementById("typing-indicator");
  const statusElement = document.querySelector(".status"); // Get status indicator

  // Check if all elements are found
  if (!chatBox || !chatInput || !chatSend || !deepsearchBtn || !thinkBtn || !attachBtn || !typingIndicator) {
    console.error("One or more DOM elements not found. Check your HTML IDs.");
    return;
  }

  // Listen for status changes from Firestore
  if (db) {
    db.collection("system").doc("status").onSnapshot((doc) => {
      if (doc.exists) {
        const statusData = doc.data();
        if (statusData && statusData.message) {
          statusElement.textContent = statusData.message;
          
          // Set color based on status type
          if (statusData.type === "online") {
            statusElement.style.color = "#28a745"; // Green
          } else if (statusData.type === "updating") {
            statusElement.style.color = "rgb(231, 158, 0)"; // Orange (from your CSS)
          } else if (statusData.type === "offline") {
            statusElement.style.color = "#dc3545"; // Red
          }
        }
      } else {
        console.log("No status document found");
      }
    }, (error) => {
      console.error("Error getting status:", error);
    });
  } else {
    console.error("Firebase database not initialized");
  }

  // Add message to chat box
  function addMessage(text, className) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", className);
    messageDiv.innerHTML = `<p>${text}</p>`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom
  }

  async function fetchAIResponse(userInput, mode = "default") {
    const model = AI_CONFIG.MODELS[mode] || AI_CONFIG.MODELS.default;
    
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;
    const requestOptions = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AI_CONFIG.API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: userInput,
        parameters: {
          max_length: AI_CONFIG.MAX_LENGTH,
          temperature: AI_CONFIG.TEMPERATURE,
          top_p: 0.9,
          return_full_text: false
        }
      })
    };

  try {
    const response = await fetch(apiUrl, requestOptions);
    const data = await response.json();
    
    if (response.ok) {
      // Process response based on the model return format
      let text = data[0]?.generated_text || "I couldn't generate a response.";
      return text;
    } else {
      console.error("API error:", data);
      return "Sorry, I encountered an error processing your request.";
    }
  } catch (error) {
    console.error("Error fetching from Hugging Face:", error);
    return "Sorry, I couldn't connect to my language model right now.";
  }
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


