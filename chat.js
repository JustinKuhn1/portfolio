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
  if (!chatBox || !chatInput || !chatSend || !typingIndicator) {
    console.error("One or more DOM elements not found. Check your HTML IDs.");
    return;
  }

  // Listen for status changes from Firestore
  if (typeof db !== 'undefined' && db) {
    db.collection("system").doc("status").onSnapshot((doc) => {
      if (doc.exists && statusElement) {
        const statusData = doc.data();
        if (statusData && statusData.message) {
          statusElement.textContent = statusData.message;
          
          // Set color based on status type
          if (statusData.type === "online") {
            statusElement.style.color = "#28a745"; // Green
          } else if (statusData.type === "updating") {
            statusElement.style.color = "rgb(231, 158, 0)"; // Orange
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
  }
  
  // Vext API configuration
  const vextApiKey = "TcW8hzf6.5mCf5B2T5zmv0ruHyXgjdpD5EwIN5bU8";
  const vextEndpoint = "https://payload.vextapp.com/hook/PY9VXD8QLS/catch/$kuhnai";

  // Add message to chat box
  function addMessage(text, className) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", className);
    messageDiv.innerHTML = `<p>${text}</p>`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom
  }

  async function fetchAIResponse(userInput) {
    typingIndicator.style.display = "flex";
    
    try {
      const response = await fetch(vextEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Apikey": `Api-Key ${vextApiKey}`
        },
        body: JSON.stringify({
          payload: userInput
        })
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
      }
  
      const data = await response.json();
      console.log("API Response:", data); // Log the full response to see its structure
      
      // Try to access the response using different potential property names
      if (data.result) return data.result;
      if (data.payload) return data.payload;
      if (data.response) return data.response;
      if (data.message) return data.message;
      if (data.text) return data.text;
      if (data.content) return data.content;
      
      // If we get here, try to use the data itself if it's a string
      if (typeof data === 'string') return data;
      
      // If all else fails
      return "I couldn't generate a response. (Check console for API details)";
    } catch (error) {
      console.error("Vext API Error:", error);
      return "Sorry, there was an error connecting to the AI. Please try again later.";
    } finally {
      typingIndicator.style.display = "none";
    }
  }

  // Handle sending messages
  async function handleMessage() {
    const inputText = chatInput.value.trim();
    if (!inputText) return;

    // Add user message
    addMessage(inputText, "user-message");
    chatInput.value = ""; // Clear input
    chatSend.disabled = true; // Disable send button

    // Fetch and display AI response
    const aiResponse = await fetchAIResponse(inputText);
    addMessage(aiResponse, "ai-message");
    
    // Re-enable send button after message is processed
    chatSend.disabled = false;
  }

  // Event listeners
  chatSend.addEventListener("click", handleMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleMessage();
  });
  chatInput.addEventListener("input", () => {
    chatSend.disabled = !chatInput.value.trim();
  });

  // Initialize optional buttons if they exist
  if (deepsearchBtn) {
    deepsearchBtn.addEventListener("click", () => {
      // Implement deepsearch functionality
      console.log("Deepsearch clicked");
    });
  }
  
  if (thinkBtn) {
    thinkBtn.addEventListener("click", () => {
      // Implement thinking functionality
      console.log("Think clicked");
    });
  }
  
  if (attachBtn) {
    attachBtn.addEventListener("click", () => {
      // Implement attachment functionality
      console.log("Attach clicked");
    });
  }

  // Initial setup
  chatSend.disabled = true;
  console.log("Chat script initialized successfully with Vext API");
});