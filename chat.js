// Chat functionality
document.getElementById("chat-send").addEventListener("click", sendChat);
document.getElementById("chat-input").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    sendChat();
  }
});

function sendChat() {
  const inputEl = document.getElementById("chat-input");
  const message = inputEl.value.trim();
  if (!message) return;
  
  appendMessage("user", message);
  inputEl.value = "";

  // OpenAI API call
  fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer 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"  // Replace with your key
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }]
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.choices && data.choices.length > 0) {
      const reply = data.choices[0].message.content;
      appendMessage("ai", reply);
    } else {
      appendMessage("ai", "No response from API.");
    }
  })
  .catch(err => {
    console.error(err);
    appendMessage("ai", "Error: Could not fetch response.");
  });
}

function appendMessage(sender, text) {
  const chatBox = document.getElementById("chat-box");
  const messageEl = document.createElement("div");
  messageEl.classList.add("chat-message", sender);
  messageEl.innerText = text;
  chatBox.appendChild(messageEl);
  chatBox.scrollTop = chatBox.scrollHeight;
}
