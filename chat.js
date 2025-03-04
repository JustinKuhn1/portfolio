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

  // Add message to chat box
  function addMessage(text, className) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", className);
    messageDiv.innerHTML = `<p>${text}</p>`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom
  }

  // Fetch response from Cloudflare Worker (kuhnauthapi) with CORS debugging
  async function fetchAIResponse(userInput, mode = "default") {
    typingIndicator.style.display = "flex"; // Show typing indicator
    try {
      console.log("Sending to Worker:", userInput, "Mode:", mode, "From Origin:", window.location.origin, "Worker URL:", 'https://kuhnauthapi.kuhnj8313.workers.dev/');
      const response = await fetch('https://kuhnauthapi.kuhnj8313.workers.dev/', { // Use the Worker’s default URL
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
  });

  thinkBtn.addEventListener("click", () => {
    console.log("Think button clicked");
    handleMessage("think");
  });

  attachBtn.addEventListener("click", () => {
    console.log("Attach button clicked");
    addMessage("Attach feature coming soon!", "ai-message");
  });

  // Initial setup
  chatSend.disabled = true;
  console.log("Chat script initialized successfully with Cloudflare Worker (kuhnauthapi)");
});