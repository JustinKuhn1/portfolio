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
    db.collection("system")
      .doc("status")
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const statusData = doc.data();
            if (statusData && statusData.message) {
              statusElement.textContent = statusData.message;
              statusElement.style.color =
                statusData.type === "online"
                  ? "#28a745" // Green
                  : statusData.type === "updating"
                  ? "rgb(231, 158, 0)" // Orange (from your CSS)
                  : "#dc3545"; // Red
            }
          } else {
            console.log("No status document found");
          }
        },
        (error) => {
          console.error("Error getting status:", error);
        }
      );
  } else {
    console.error("Firebase database not initialized");
  }

  // Add message to chat box with fade-in animation and markdown parsing
  function addMessage(text, className) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", className); // Add .message class immediately

    // Parse markdown bold (**text**) to HTML <strong> tags using regex
    const parsedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    messageDiv.innerHTML = `<p>${parsedText}</p>`;

    // Add the message to the chat box, triggering the animation
    chatBox.appendChild(messageDiv);

    // Ensure the animation plays by adding a small delay or forcing reflow
    requestAnimationFrame(() => {
      messageDiv.style.opacity = '0'; // Reset opacity
      requestAnimationFrame(() => {
        messageDiv.style.opacity = '1'; // Trigger the animation by changing opacity
      });
    });

    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom
  }

  // Fetch response from Cloudflare Worker (kuhnauthapi) with CORS debugging
  async function fetchAIResponse(userInput, mode = "default") {
    typingIndicator.style.display = "flex"; // Show typing indicator
    try {
      console.log("Sending to Worker:", userInput, "Mode:", mode, "From Origin:", window.location.origin, "Worker URL:", 'https://kuhnauthapi.kuhnj8313.workers.dev/chat');
      const response = await fetch('https://kuhnauthapi.kuhnj8313.workers.dev/chat', { // Use the Worker’s default URL
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: userInput, mode: mode }), // Include mode for Vext
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Worker API Error Response:", errorText);
        throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Worker API Response Data:", data);

      // Try to find the response in various common formats
      if (data.result) return data.result;
      if (data.response) return data.response;
      if (data.payload) return data.payload;
      if (data.text) return data.text;
      if (data.message) return data.message;
      if (data.output) return data.output;
      if (data.generated_text) return data.generated_text;
      if (data.choices && data.choices[0]) {
        if (data.choices[0].text) return data.choices[0].text;
        if (data.choices[0].message && data.choices[0].message.content) return data.choices[0].message.content;
      }

      return JSON.stringify(data) || "I couldn't generate a response.";
    } catch (error) {
      console.error("Worker API Error:", error);
      addMessage("Sorry, there was an error connecting to the AI. (Check console for details)", "ai-message");
      return "Error: Unable to connect.";
    } finally {
      typingIndicator.style.display = "none"; // Hide typing indicator
    }
  }

  // Handle sending messages with optional mode
  async function handleMessage(mode = "default") {
    const inputText = chatInput.value.trim();
    if (!inputText) return;

    // Add user message
    addMessage(inputText, "user-message");
    chatInput.value = ""; // Clear input
    chatSend.disabled = true; // Disable send button

    // Fetch and display AI response
    const aiResponse = await fetchAIResponse(inputText, mode);
    addMessage(aiResponse, "ai-message");
  }

  // Event listeners
  chatSend.addEventListener("click", () => handleMessage("default"));
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleMessage("default");
  });
  chatInput.addEventListener("input", () => {
    chatSend.disabled = !chatInput.value.trim();
  });

  deepsearchBtn.addEventListener("click", () => {
    console.log("Deepsearch button clicked");
    handleMessage("deepsearch");
    addMessage("DeepSearch is only available to KuhnAI devlopers. This feature will be coming soon to Pro accounts.", "ai-message");
  });

  thinkBtn.addEventListener("click", () => {
    console.log("Think button clicked");
    handleMessage("think");
    addMessage("Advanced reasoning is only available to KuhnAI devlopers. This feature will be coming soon to Pro accounts.", "ai-message");
  });

  attachBtn.addEventListener("click", () => {
    console.log("Attach button clicked");
    addMessage("Attach feature coming soon!", "ai-message");
  });

  // Initial setup
  chatSend.disabled = true;
  console.log("Chat script initialized successfully with Cloudflare Worker (kuhnauthapi)");
});

// Add this to your existing chat.js or create a new file called chat-history.js

// Function to save a message to the user's chat history
async function saveMessageToHistory(messageType, messageText) {
  // Ensure user is logged in
  const user = firebase.auth().currentUser;
  if (!user) {
    console.log("No user logged in. Cannot save chat history.");
    return false;
  }

  try {
    // Reference to the user's chat history collection
    const chatHistoryRef = db.collection("users").doc(user.uid).collection("chat_history");

    // Save the message
    await chatHistoryRef.add({
      message: messageText,
      type: messageType, // 'user' or 'ai'
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      model: "KuhnNova o1" // Specify the AI model used
    });

    return true;
  } catch (error) {
    console.error("Error saving message to chat history:", error);
    return false;
  }
}

// Function to fetch chat history
async function fetchChatHistory(limit = 50) {
  // Ensure user is logged in
  const user = firebase.auth().currentUser;
  if (!user) {
    console.log("No user logged in. Cannot fetch chat history.");
    return [];
  }

  try {
    // Reference to the user's chat history collection
    const chatHistoryRef = db.collection("users").doc(user.uid).collection("chat_history");

    // Fetch most recent messages, ordered by timestamp
    const snapshot = await chatHistoryRef
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    // Convert snapshot to array of message objects
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).reverse(); // Reverse to get chronological order
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }
}

// Modify your existing addMessage function in chat.js to save messages
function addMessage(text, className) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", className);

  // Parse markdown bold (**text**) to HTML <strong> tags using regex
  const parsedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  messageDiv.innerHTML = `<p>${parsedText}</p>`;

  // Add the message to the chat box, triggering the animation
  chatBox.appendChild(messageDiv);

  // Save message to chat history
  const messageType = className === 'user-message' ? 'user' : 'ai';
  saveMessageToHistory(messageType, text);

  // Existing animation and scroll logic...
  requestAnimationFrame(() => {
    messageDiv.style.opacity = '0';
    requestAnimationFrame(() => {
      messageDiv.style.opacity = '1';
    });
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

// Optional: Load chat history when page loads
document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const chatHistory = await fetchChatHistory();
        
        // Clear existing welcome message
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
          welcomeMessage.remove();
        }

        // Populate chat box with previous messages
        chatHistory.forEach(message => {
          const className = message.type === 'user' ? 'user-message' : 'ai-message';
          addMessage(message.message, className);
        });
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    }
  });
});

// Optionally, add a method to clear chat history
async function clearChatHistory() { 
  const user = firebase.auth().currentUser;
  if (!user) {
    console.log("No user logged in. Cannot clear chat history.");
    return false;
  }

  try {
    const chatHistoryRef = db.collection("users").doc(user.uid).collection("chat_history");
    
    // Fetch all documents and delete them
    const snapshot = await chatHistoryRef.get();
    snapshot.docs.forEach(doc => doc.ref.delete());

    // Clear the chat box
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = `
      <div class="message welcome-message">
        <p>Chat history cleared. Start a new conversation!</p>
      </div>
    `;

    return true;
  } catch (error) {
    console.error("Error clearing chat history:", error);
    return false;
  }
}

// Export functions if you're using modules
export { 
  saveMessageToHistory, 
  fetchChatHistory, 
  clearChatHistory 
};

