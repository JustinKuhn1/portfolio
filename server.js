// On your backend (server.js)
const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());

const HF_API_TOKEN = process.env.HUGGING_FACE_API_TOKEN; // Store in environment variable

app.post('/api/generate', async (req, res) => {
  const { userInput, mode } = req.body;
  
  // Select model based on mode
  let model = "gpt2";
  if (mode === "deepsearch") model = "gpt-neo-2.7B";
  if (mode === "think") model = "gpt-j-6B";
  
  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: userInput,
        parameters: { max_length: 100, temperature: 0.7 }
      })
    });
    
    const data = await response.json();
    res.json({ response: data[0]?.generated_text || "No response" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));