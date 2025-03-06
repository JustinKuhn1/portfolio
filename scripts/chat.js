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
  const sessionToggleBtn = document.getElementById("session-toggle-btn");
  const sessionSidebar = document.getElementById("session-sidebar");
  const sessionList = document.getElementById("session-list");
  const newTempChatBtn = document.getElementById("new-temp-chat-btn");
  const newChatSessionBtn = document.getElementById("new-chat-session");

  // Validate DOM elements
  if (
    !chatBox ||
    !chatInput ||
    !chatSend ||
    !deepsearchBtn ||
    !thinkBtn ||
    !attachBtn ||
    !typingIndicator ||
    !sessionToggleBtn ||
    !sessionSidebar ||
    !sessionList ||
    !newTempChatBtn ||
    !newChatSessionBtn
  ) {
    console.error("One or more chat DOM elements not found. Check your HTML IDs.");
    return;
  }

  let currentSessionId = localStorage.getItem("currentSessionId") || null;

  // Modal for chat history (unchanged)
  function createChatHistoryModal() {
    const modal = document.createElement("div");
    modal.id = "chat-history-modal";
    modal.classList.add("chat-history-modal");
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

    const closeBtn = modal.querySelector("#close-history-modal");
    closeBtn.addEventListener("click", () => (modal.style.display = "none"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
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
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        currentSessionId = sessionDoc.id;
        localStorage.setItem("currentSessionId", currentSessionId);
        loadChatSessions(); // Refresh session list
      }
      await sessionsRef
        .doc(currentSessionId)
        .collection("messages")
        .add({
          message: messageText,
          type: messageType,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          model: "KuhnNova o1",
        });
      return true;
    } catch (error) {
      console.error("Error saving message:", error);
      return false;
    }
  }

  // Fetch and display chat history in modal (unchanged)
  async function displayChatHistory() {
    const user = firebase.auth().currentUser;
    if (!user) {
      alert("Please log in to view chat history.");
      return;
    }

    const modal = document.getElementById("chat-history-modal") || createChatHistoryModal();
    const historyList = modal.querySelector("#chat-history-list");
    historyList.innerHTML = "";

    try {
      const sessionsRef = db
        .collection("users")
        .doc(user.uid)
        .collection("chat_sessions");
      const snapshot = await sessionsRef.orderBy("createdAt", "desc").limit(100).get();

      if (snapshot.empty) {
        historyList.innerHTML = "<p>No chat sessions found.</p>";
        modal.style.display = "block";
        return;
      }

      for (const sessionDoc of snapshot.docs) {
        const sessionData = sessionDoc.data();
        const messagesRef = sessionsRef.doc(sessionDoc.id).collection("messages");
        const msgSnapshot = await messagesRef.orderBy("timestamp", "desc").limit(10).get();

        const sessionHeader = document.createElement("h3");
        sessionHeader.textContent = sessionData.name || `Session ${sessionDoc.id.slice(0, 8)}`;
        historyList.appendChild(sessionHeader);

        msgSnapshot.forEach((doc) => {
          const messageData = doc.data();
          const messageItem = document.createElement("div");
          messageItem.classList.add(
            "history-message",
            messageData.type === "user" ? "user-history" : "ai-history"
          );
          const timestamp = messageData.timestamp
            ? new Date(messageData.timestamp.toDate()).toLocaleString()
            : "Unknown time";
          messageItem.innerHTML = `
            <div class="history-message-content">
              <span class="history-timestamp">${timestamp}</span>
              <p>${messageData.message}</p>
            </div>
          `;
          historyList.appendChild(messageItem);
        });
      }

      modal.style.display = "block";
    } catch (error) {
      console.error("Error fetching chat history:", error);
      alert("Failed to load chat history.");
    }
  }

  // Add message to chat box
  function addMessage(text, className, loadingHistory = false) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", className);
    const parsedText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    messageDiv.innerHTML = `<p>${parsedText}</p>`;
    chatBox.appendChild(messageDiv);

    if (!loadingHistory) {
      const messageType = className === "user-message" ? "user" : "ai";
      saveMessageToHistory(messageType, text);
    }

    requestAnimationFrame(() => {
      messageDiv.style.opacity = "0";
      requestAnimationFrame(() => (messageDiv.style.opacity = "1"));
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Fetch AI response
  async function fetchAIResponse(userInput, mode = "default") {
    typingIndicator.style.display = "flex";
    try {
      const response = await fetch(
        "https://kuhnauthapi.kuhnj8313.workers.dev/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: userInput, mode: mode }),
        }
      );

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      return (
        data.result || data.response || data.text || "I couldn't generate a response."
      );
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

  // Load chat sessions with fixed sidebar
  async function loadChatSessions() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const sessionsRef = db
      .collection("users")
      .doc(user.uid)
      .collection("chat_sessions");
    const snapshot = await sessionsRef.orderBy("createdAt", "desc").get();

    // Group sessions by date
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const todaySessions = [];
    const yesterdaySessions = [];
    const olderSessions = [];

    snapshot.forEach((doc) => {
      const session = doc.data();
      const sessionDate = session.createdAt ? session.createdAt.toDate() : new Date();
      const sessionObj = {
        id: doc.id,
        name: session.name || `Session ${doc.id.slice(0, 8)}`,
        createdAt: sessionDate,
      };

      const diffTime = today - sessionDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        todaySessions.push(sessionObj);
      } else if (diffDays === 1) {
        yesterdaySessions.push(sessionObj);
      } else {
        olderSessions.push(sessionObj);
      }
    });

    // Populate session list
    sessionList.innerHTML = "";

    // Today
    if (todaySessions.length > 0) {
      const todayGroup = document.createElement("div");
      todayGroup.classList.add("session-group");
      todayGroup.innerHTML = "<h4>Today</h4>";
      todaySessions.forEach((session) => {
        const item = createSessionItem(session);
        todayGroup.appendChild(item);
      });
      sessionList.appendChild(todayGroup);
    }

    // Yesterday
    if (yesterdaySessions.length > 0) {
      const yesterdayGroup = document.createElement("div");
      yesterdayGroup.classList.add("session-group");
      yesterdayGroup.innerHTML = "<h4>Yesterday</h4>";
      yesterdaySessions.forEach((session) => {
        const item = createSessionItem(session);
        yesterdayGroup.appendChild(item);
      });
      sessionList.appendChild(yesterdayGroup);
    }

    // Older
    if (olderSessions.length > 0) {
      const olderGroup = document.createElement("div");
      olderGroup.classList.add("session-group");
      olderGroup.innerHTML = "<h4>Older</h4>";
      olderSessions.forEach((session) => {
        const item = createSessionItem(session);
        olderGroup.appendChild(item);
      });
      sessionList.appendChild(olderGroup);
    }

    // Add the "Create New Temporary Chat" button
    const tempChatBtn = document.createElement("button");
    tempChatBtn.classList.add("new-temp-chat-btn");
    tempChatBtn.textContent = "Create New Temporary Chat";
    tempChatBtn.addEventListener("click", () => {
      currentSessionId = null;
      localStorage.removeItem("currentSessionId");
      chatBox.innerHTML =
        '<div class="message welcome-message"><p>Hello! I\'m KuhnAI. What\'s on your mind?</p></div>';
      sessionList.querySelectorAll(".session-item").forEach((el) => el.classList.remove("active"));
    });
    sessionList.appendChild(tempChatBtn);
  }

  // Create a session item
  function createSessionItem(session) {
    const item = document.createElement("div");
    item.classList.add("session-item");
    if (session.id === currentSessionId) {
      item.classList.add("active");
    }

    const timeDiff = new Date() - session.createdAt;
    let timestampText = "";
    if (timeDiff < 60 * 1000) {
      timestampText = `${Math.floor(timeDiff / 1000)} seconds ago`;
    } else if (timeDiff < 60 * 60 * 1000) {
      timestampText = `${Math.floor(timeDiff / (60 * 1000))} minutes ago`;
    } else if (timeDiff < 24 * 60 * 60 * 1000) {
      timestampText = `${Math.floor(timeDiff / (60 * 60 * 1000))} hours ago`;
    } else {
      timestampText = `${Math.floor(timeDiff / (24 * 60 * 60 * 1000))} days ago`;
    }

    item.innerHTML = `
      <span>${session.name}</span>
      <span class="timestamp">${timestampText}</span>
    `;

    item.addEventListener("click", () => {
      loadSessionMessages(session.id);
      sessionList.querySelectorAll(".session-item").forEach((el) => el.classList.remove("active"));
      item.classList.add("active");
    });

    return item;
  }

  // Load messages for a specific session
  function loadSessionMessages(sessionId) {
    if (!sessionId) {
      chatBox.innerHTML =
        '<div class="message welcome-message"><p>Hello! I\'m KuhnAI. What\'s on your mind?</p></div>';
      return;
    }
    currentSessionId = sessionId;
    localStorage.setItem("currentSessionId", sessionId);
    const user = firebase.auth().currentUser;
    const messagesRef = db
      .collection("users")
      .doc(user.uid)
      .collection("chat_sessions")
      .doc(sessionId)
      .collection("messages");
    messagesRef
      .orderBy("timestamp", "asc")
      .limit(50)
      .get()
      .then((snapshot) => {
        chatBox.innerHTML = "";
        snapshot.forEach((doc) => {
          const messageData = doc.data();
          const className = messageData.type === "user" ? "user-message" : "ai-message";
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
  chatInput.addEventListener("input", () => (chatSend.disabled = !chatInput.value.trim()));

  deepsearchBtn.addEventListener("click", () => {
    addMessage("DeepSearch is only available to KuhnAI developers.", "ai-message");
  });

  thinkBtn.addEventListener("click", () => {
    addMessage("Advanced reasoning is only available to KuhnAI developers.", "ai-message");
  });

  attachBtn.addEventListener("click", () => {
    addMessage("Attach feature coming soon!", "ai-message");
  });

  // Toggle sidebar visibility
  sessionToggleBtn.addEventListener("click", () => {
    sessionSidebar.classList.toggle("active");
  });

  // Close sidebar when clicking outside
  document.addEventListener("click", (e) => {
    if (!sessionToggleBtn.contains(e.target) && !sessionSidebar.contains(e.target)) {
      sessionSidebar.classList.remove("active");
    }
  });

  // New chat session button
  newChatSessionBtn.addEventListener("click", () => {
    const user = firebase.auth().currentUser;
    if (!user) {
      alert("Please log in to create a new chat session.");
      return;
    }
    const sessionsRef = db
      .collection("users")
      .doc(user.uid)
      .collection("chat_sessions");
    const sessionName = prompt("Enter a name for this chat session (optional):");
    sessionsRef
      .add({
        name: sessionName || `Session ${Date.now()}`,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then((docRef) => {
        currentSessionId = docRef.id;
        localStorage.setItem("currentSessionId", currentSessionId);
        loadChatSessions();
        chatBox.innerHTML =
          '<div class="message welcome-message"><p>Hello! I\'m KuhnAI. What\'s on your mind?</p></div>';
      });
  });

  // Load chat history on login
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      loadChatSessions();
    }
  });

  // Setup chat history button (unchanged)
  const chatHistoryBtn = document.getElementById("chat-history-btn");
  if (chatHistoryBtn) {
    chatHistoryBtn.addEventListener("click", () => {
      const user = firebase.auth().currentUser;
      if (user) displayChatHistory();
      else alert("Please log in to view chat history.");
    });
  }

  // Status listener (unchanged)
  if (db) {
    db.collection("system")
      .doc("status")
      .onSnapshot((doc) => {
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
      });
  }

  chatSend.disabled = true;
  console.log("Chat functionality initialized successfully");
});