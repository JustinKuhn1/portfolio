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

  // Track whether history has been loaded
  let historyLoaded = false;

  // Modal for chat history
  function createChatHistoryModal() {
    const modal = document.createElement('div');
    modal.id = 'chat-history-modal';
    modal.classList.add('chat-history-modal');
    modal.innerHTML = `
      <div class="chat-history-content">
        <div class="chat-history-header">
          <h2>Chat History</h2>
          <button id="close-history-modal">×</button>
        </div>
        <div id="chat-history-list" class="chat-history-list">
          <!-- History items will be populated here -->
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#close-history-modal');
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    return modal;
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

  // Fetch and display chat history in modal
  async function displayChatHistory() {
    console.log("Attempting to display chat history");

    const user = firebase.auth().currentUser;
    if (!user) {
      console.error('No user logged in');
      alert('Please log in to view chat history.');
      return;
    }

    const modal = document.getElementById('chat-history-modal') || createChatHistoryModal();
    const historyList = modal.querySelector('#chat-history-list');
    historyList.innerHTML = ''; // Clear previous history

    try {
      console.log(`Fetching history for user: ${user.uid}`);
      const chatHistoryRef = db.collection("users").doc(user.uid).collection("chat_history");
      const snapshot = await chatHistoryRef
        .orderBy("timestamp", "desc")
        .limit(100)
        .get();

      console.log(`Found ${snapshot.docs.length} history items`);

      if (snapshot.empty) {
        historyList.innerHTML = '<p>No chat history found.</p>';
        modal.style.display = 'block';
        return;
      }

      snapshot.docs.forEach(doc => {
        const messageData = doc.data();
        const messageItem = document.createElement('div');
        messageItem.classList.add('history-message');
        messageItem.classList.add(messageData.type === 'user' ? 'user-history' : 'ai-history');
        
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
      alert('Failed to load chat history. Check console for details.');
    }
  }

  // Add message to chat box (without saving to history if loadingHistory is true)
  function addMessage(text, className, loadingHistory = false) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", className);

    const parsedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    messageDiv.innerHTML = `<p>${parsedText}</p>`;

    chatBox.appendChild(messageDiv);

    // Only save to history if not loading existing history
    if (!loadingHistory) {
      const messageType = className === 'user-message' ? 'user' : 'ai';
      saveMessageToHistory(messageType, text);
    }

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

    addMessage(inputText, "user-message");
    chatInput.value = "";
    chatSend.disabled = true;

    try {
      const aiResponse = await fetchAIResponse(inputText, mode);
      addMessage(aiResponse, "ai-message");
    } catch (error) {
      console.error("Message handling error:", error);
      addMessage("An error occurred while processing your message.", "ai-message");
    }
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
                  ? "#28a745"
                  : statusData.type === "updating"
                  ? "rgb(231, 158, 0)"
                  : "#dc3545";
            }
          }
        },
        (error) => {
          console.error("Error getting status:", error);
        }
      );
  }

  // Event Listeners
  chatSend.addEventListener("click", () => handleMessage("default"));
  
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleMessage("default");
    }
  });

  chatInput.addEventListener("input", () => {
    chatSend.disabled = !chatInput.value.trim();
  });

  deepsearchBtn.addEventListener("click", () => {
    addMessage("DeepSearch is only available to KuhnAI developers. This feature will be coming soon to Pro accounts.", "ai-message");
  });

  thinkBtn.addEventListener("click", () => {
    addMessage("Advanced reasoning is only available to KuhnAI developers. This feature will be coming soon to Pro accounts.", "ai-message");
  });

  attachBtn.addEventListener("click", () => {
    addMessage("Attach feature coming soon!", "ai-message");
  });

  // Load chat history on login only once
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user && !historyLoaded) {
      try {
        const chatHistoryRef = db.collection("users").doc(user.uid).collection("chat_history");
        const snapshot = await chatHistoryRef
          .orderBy("timestamp", "asc")
          .limit(50)
          .get();

        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
          welcomeMessage.remove();
        }

        chatBox.innerHTML = ''; // Clear existing chat box content

        snapshot.docs.forEach(doc => {
          const messageData = doc.data();
          const className = messageData.type === 'user' ? 'user-message' : 'ai-message';
          addMessage(messageData.message, className, true); // Pass true to avoid saving
        });

        historyLoaded = true; // Mark history as loaded
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    }
  });

  // Setup chat history button
  function setupChatHistoryButton() {
    const chatHistoryBtn = document.getElementById('chat-history-btn');
    if (chatHistoryBtn) {
      chatHistoryBtn.addEventListener('click', () => {
        const user = firebase.auth().currentUser;
        if (user) {
          displayChatHistory();
        } else {
          alert('Please log in to view chat history.');
        }
      });
    }
  }

  setupChatHistoryButton();

  chatSend.disabled = true;
  console.log("Chat functionality initialized successfully");
});