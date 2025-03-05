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
  const chatSessionSelect = document.getElementById("chat-session-select");
  const newChatSessionBtn = document.getElementById("new-chat-session");

  // Validate DOM elements
  if (!chatBox || !chatInput || !chatSend || !deepsearchBtn || !thinkBtn || !attachBtn || !typingIndicator || !chatSessionSelect || !newChatSessionBtn) {
    console.error("One or more chat DOM elements not found. Check your HTML IDs.");
    return;
  }

  let currentSessionId = localStorage.getItem('currentSessionId') || null;

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
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });

    return modal;
  }

  // Save message to user's chat history
  async function saveMessageToHistory(messageType, messageText) {
    const user = firebase.auth().currentUser;
    if (!user) return false;

    try {
      const sessionsRef = db.collection("users").doc(user.uid).collection("chat_sessions");
      if (!currentSessionId) {
        const sessionDoc = await sessionsRef.add({
          name: `Session ${Date.now()}`,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        currentSessionId = sessionDoc.id;
        localStorage.setItem('currentSessionId', currentSessionId);
        loadChatSessions(); // Refresh session list
      }
      await sessionsRef.doc(currentSessionId).collection('messages').add({
        message: messageText,
        type: messageType,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        model: "KuhnNova o1"
      });
      return true;
    } catch (error) {
      console.error("Error saving message:", error);
      return false;
    }
  }

  // Fetch and display chat history in modal
  async function displayChatHistory() {
    const user = firebase.auth().currentUser;
    if (!user) {
      alert('Please log in to view chat history.');
      return;
    }

    const modal = document.getElementById('chat-history-modal') || createChatHistoryModal();
    const historyList = modal.querySelector('#chat-history-list');
    historyList.innerHTML = '';

    try {
      const sessionsRef = db.collection("users").doc(user.uid).collection("chat_sessions");
      const snapshot = await sessionsRef.orderBy("createdAt", "desc").limit(100).get();

      if (snapshot.empty) {
        historyList.innerHTML = '<p>No chat sessions found.</p>';
        modal.style.display = 'block';
        return;
      }

      for (const sessionDoc of snapshot.docs) {
        const sessionData = sessionDoc.data();
        const messagesRef = sessionsRef.doc(sessionDoc.id).collection('messages');
        const msgSnapshot = await messagesRef.orderBy("timestamp", "desc").limit(10).get();

        const sessionHeader = document.createElement('h3');
        sessionHeader.textContent = sessionData.name || `Session ${sessionDoc.id.slice(0, 8)}`;
        historyList.appendChild(sessionHeader);

        msgSnapshot.forEach(doc => {
          const messageData = doc.data();
          const messageItem = document.createElement('div');
          messageItem.classList.add('history-message', messageData.type === 'user' ? 'user-history' : 'ai-history');
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
      }

      modal.style.display = 'block';
    } catch (error) {
      console.error("Error fetching chat history:", error);
      alert('Failed to load chat history.');
    }
  }

  // Add message to chat box
  function addMessage(text, className, loadingHistory = false) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", className);
    const parsedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    messageDiv.innerHTML = `<p>${parsedText}</p>`;
    chatBox.appendChild(messageDiv);

    if (!loadingHistory) {
      const messageType = className === 'user-message' ? 'user' : 'ai';
      saveMessageToHistory(messageType, text);
    }

    requestAnimationFrame(() => {
      messageDiv.style.opacity = '0';
      requestAnimationFrame(() => messageDiv.style.opacity = '1');
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Fetch AI response
  async function fetchAIResponse(userInput, mode = "default") {
    typingIndicator.style.display = "flex";
    try {
      const response = await fetch('https://kuhnauthapi.kuhnj8313.workers.dev/chat', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userInput, mode: mode })
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      return data.result || data.response || data.text || "I couldn't generate a response.";
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
      addMessage("An error occurred while processing your message.", "ai-message");
    }
  }

  // Load chat sessions
  function loadChatSessions() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const sessionsRef = db.collection("users").doc(user.uid).collection("chat_sessions");
    sessionsRef.orderBy("createdAt", "desc").get().then((snapshot) => {
      chatSessionSelect.innerHTML = '<option value="">Select a session</option>';
      snapshot.forEach(doc => {
        const session = doc.data();
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = session.name || `Session ${doc.id.slice(0, 8)}`;
        chatSessionSelect.appendChild(option);
      });
      if (currentSessionId) {
        chatSessionSelect.value = currentSessionId;
        loadSessionMessages(currentSessionId);
      } else if (snapshot.docs.length > 0) {
        currentSessionId = snapshot.docs[0].id;
        localStorage.setItem('currentSessionId', currentSessionId);
        chatSessionSelect.value = currentSessionId;
        loadSessionMessages(currentSessionId);
      }
    });
  }

  // Load messages for a specific session
  function loadSessionMessages(sessionId) {
    if (!sessionId) {
      chatBox.innerHTML = '<div class="message welcome-message"><p>Hello! I\'m KuhnAI. What\'s on your mind?</p></div>';
      return;
    }
    currentSessionId = sessionId;
    localStorage.setItem('currentSessionId', sessionId);
    const user = firebase.auth().currentUser;
    const messagesRef = db.collection("users").doc(user.uid).collection("chat_sessions").doc(sessionId).collection('messages');
    messagesRef.orderBy("timestamp", "asc").limit(50).get().then((snapshot) => {
      chatBox.innerHTML = '';
      snapshot.forEach(doc => {
        const messageData = doc.data();
        const className = messageData.type === 'user' ? 'user-message' : 'ai-message';
        addMessage(messageData.message, className, true);
      });
    });
  }

  // Event Listeners
  chatSend.addEventListener("click", () => handleMessage("default"));
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleMessage("default");
    }
  });
  chatInput.addEventListener("input", () => chatSend.disabled = !chatInput.value.trim());

  deepsearchBtn.addEventListener("click", () => {
    addMessage("DeepSearch is only available to KuhnAI developers.", "ai-message");
  });

  thinkBtn.addEventListener("click", () => {
    addMessage("Advanced reasoning is only available to KuhnAI developers.", "ai-message");
  });

  attachBtn.addEventListener("click", () => {
    addMessage("Attach feature coming soon!", "ai-message");
  });

  newChatSessionBtn.addEventListener("click", () => {
    const user = firebase.auth().currentUser;
    if (!user) {
      alert('Please log in to create a new chat session.');
      return;
    }
    const sessionsRef = db.collection("users").doc(user.uid).collection("chat_sessions");
    const sessionName = prompt('Enter a name for this chat session (optional):');
    sessionsRef.add({
      name: sessionName || `Session ${Date.now()}`,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then((docRef) => {
      currentSessionId = docRef.id;
      localStorage.setItem('currentSessionId', currentSessionId);
      loadChatSessions();
      chatBox.innerHTML = '<div class="message welcome-message"><p>Hello! I\'m KuhnAI. What\'s on your mind?</p></div>';
    });
  });

  chatSessionSelect.addEventListener("change", (e) => {
    loadSessionMessages(e.target.value);
  });

  // Load chat history on login
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      loadChatSessions();
    }
  });

  // Setup chat history button
  const chatHistoryBtn = document.getElementById('chat-history-btn');
  if (chatHistoryBtn) {
    chatHistoryBtn.addEventListener('click', () => {
      const user = firebase.auth().currentUser;
      if (user) displayChatHistory();
      else alert('Please log in to view chat history.');
    });
  }

  // Status listener
  if (db) {
    db.collection("system").doc("status").onSnapshot((doc) => {
      if (doc.exists) {
        const statusData = doc.data();
        if (statusData && statusData.message) {
          statusElement.textContent = statusData.message;
          statusElement.style.color = statusData.type === "online" ? "#28a745" : statusData.type === "updating" ? "rgb(231, 158, 0)" : "#dc3545";
        }
      }
    });
  }

  chatSend.disabled = true;
  console.log("Chat functionality initialized successfully");
});