document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const chatBox = document.getElementById("chat-box");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const deepsearchBtn = document.getElementById("deepsearch-btn");
  const thinkBtn = document.getElementById("think-btn");
  const attachBtn = document.getElementById("attach-btn");
  const typingIndicator = document.getElementById("typing-indicator");
  const statusElement = document.querySelector(".status");

  // Validate DOM elements
  if (!chatBox || !chatInput || !chatSend || !deepsearchBtn || !thinkBtn || !attachBtn || !typingIndicator) {
    console.error("One or more chat DOM elements not found. Check your HTML IDs.");
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
  // Save message to user's chat history
  async function saveMessageToHistory(messageType, messageText) {
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log("No user logged in. Cannot save chat history.");
      return false;
    }

    try {
      const chatHistoryRef = db.collection("users").doc(user.uid).collection("chat_history");
      await chatHistoryRef.add({
        message: messageText,
        type: messageType,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        model: "KuhnNova o1"
      });
      return true;
    } catch (error) {
      console.error("Error saving message to chat history:", error);
      return false;
    }
  }

  // Add message to chat box
  function addMessage(text, className) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", className);

    // Parse markdown bold (**text**) to HTML <strong> tags
    const parsedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    messageDiv.innerHTML = `<p>${parsedText}</p>`;

    // Add message to chat box
    chatBox.appendChild(messageDiv);

    // Save message to history
    const messageType = className === 'user-message' ? 'user' : 'ai';
    saveMessageToHistory(messageType, text);

    // Animation and scroll
    requestAnimationFrame(() => {
      messageDiv.style.opacity = '0';
      requestAnimationFrame(() => {
        messageDiv.style.opacity = '1';
      });
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Fetch AI response from Cloudflare Worker
  async function fetchAIResponse(userInput, mode = "default") {
    const typingIndicator = document.getElementById("typing-indicator");
    typingIndicator.style.display = "flex";

    try {
      const response = await fetch('https://kuhnauthapi.kuhnj8313.workers.dev/chat', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: userInput, mode: mode })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract response from various possible formats
      const aiResponse = 
        data.result || 
        data.response || 
        data.payload || 
        data.text || 
        data.message || 
        data.output || 
        data.generated_text || 
        (data.choices && data.choices[0] && 
          (data.choices[0].text || 
           (data.choices[0].message && data.choices[0].message.content))) ||
        "I couldn't generate a response.";

      return aiResponse;
    } catch (error) {
      console.error("Worker API Error:", error);
      return "Sorry, there was an error connecting to the AI.";
    } finally {
      typingIndicator.style.display = "none";
    }
  }

  // Handle sending messages
  async function handleMessage(mode = "default") {
    const inputText = chatInput.value.trim();
    if (!inputText) return;

    // Add user message
    addMessage(inputText, "user-message");
    chatInput.value = ""; // Clear input
    chatSend.disabled = true; // Disable send button

    try {
      // Fetch and display AI response
      const aiResponse = await fetchAIResponse(inputText, mode);
      addMessage(aiResponse, "ai-message");
    } catch (error) {
      console.error("Message handling error:", error);
      addMessage("An error occurred while processing your message.", "ai-message");
    }
  }

  // Event Listeners
  chatSend.addEventListener("click", () => handleMessage("default"));
  
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default enter key behavior
      handleMessage("default");
    }
  });

  chatInput.addEventListener("input", () => {
    chatSend.disabled = !chatInput.value.trim();
  });

  // Special mode buttons
  deepsearchBtn.addEventListener("click", () => {
    addMessage("DeepSearch is only available to KuhnAI developers. This feature will be coming soon to Pro accounts.", "ai-message");
  });

  thinkBtn.addEventListener("click", () => {
    addMessage("Advanced reasoning is only available to KuhnAI developers. This feature will be coming soon to Pro accounts.", "ai-message");
  });

  attachBtn.addEventListener("click", () => {
    addMessage("Attach feature coming soon!", "ai-message");
  });

  // Load chat history on login
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      try {
        // Fetch chat history
        const chatHistoryRef = db.collection("users").doc(user.uid).collection("chat_history");
        const snapshot = await chatHistoryRef
          .orderBy("timestamp", "asc")
          .limit(50)
          .get();

        // Clear welcome message
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
          welcomeMessage.remove();
        }

        // Populate chat with history
        snapshot.docs.forEach(doc => {
          const messageData = doc.data();
          const className = messageData.type === 'user' ? 'user-message' : 'ai-message';
          addMessage(messageData.message, className);
        });
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    }
  });

  // Initial setup
  chatSend.disabled = true;
  console.log("Chat functionality initialized successfully");
});

// Add this function to the existing chat.js file, just before or after the existing event listeners

// Modal for chat history
function createChatHistoryModal() {
  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'chat-history-modal';
  modal.classList.add('chat-history-modal');
  modal.innerHTML = `
    <div class="chat-history-content">
      <div class="chat-history-header">
        <h2>Chat History</h2>
        <button id="close-history-modal">&times;</button>
      </div>
      <div id="chat-history-list" class="chat-history-list">
        <!-- History items will be populated here -->
      </div>
    </div>
  `;

  // Add modal to body
  document.body.appendChild(modal);

  // Close modal event
  const closeBtn = modal.querySelector('#close-history-modal');
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  return modal;
}

// Fetch and display chat history
async function displayChatHistory() {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert('Please log in to view chat history.');
    return;
  }

  const modal = document.getElementById('chat-history-modal') || createChatHistoryModal();
  const historyList = modal.querySelector('#chat-history-list');
  historyList.innerHTML = ''; // Clear previous history

  try {
    const chatHistoryRef = db.collection("users").doc(user.uid).collection("chat_history");
    const snapshot = await chatHistoryRef
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();

    if (snapshot.empty) {
      historyList.innerHTML = '<p>No chat history found.</p>';
      return;
    }

    snapshot.docs.forEach(doc => {
      const messageData = doc.data();
      const messageItem = document.createElement('div');
      messageItem.classList.add('history-message');
      messageItem.classList.add(messageData.type === 'user' ? 'user-history' : 'ai-history');
      
      // Format timestamp
      const timestamp = messageData.timestamp 
        ? new Date(messageData.timestamp.toDate()).toLocaleString() 
        : 'Unknown time';

      messageItem.innerHTML = `
        <div class="history-message-content">
          <span class="history-timestamp">${timestamp}</span>
          <p>${messageData.message}</p>
        </div>
      `;

      historyList.appendChild(messageItem);
    });

    modal.style.display = 'block';
  } catch (error) {
    console.error("Error fetching chat history:", error);
    alert('Failed to load chat history.');
  }
}

// Add event listener for chat history button
const chatHistoryBtn = document.getElementById('chat-history-btn');
if (chatHistoryBtn) {
  chatHistoryBtn.addEventListener('click', displayChatHistory);
}