// routes/chat.js
//
// Backend proxy for the Leftover Food Assistant chatbot, using the
// official @google/genai SDK. Matches what ChatAssistant.jsx expects:
//   - mounted so the final path is POST /api/chat
//   - returns { text } on success
//   - returns { error } with a status code on failure, since the
//     frontend's catch block inspects error.message for "400"/"401"/"429"
//
// SETUP:
//   npm install express dotenv @google/genai
//
// .env (project root, gitignored):
//   GEMINI_API_KEY=your-new-key-here
//
// Main server file:
//   require('dotenv').config();
//   const chatRouter = require('./routes/chat');
//   app.use(express.json());
//   app.use('/api/chat', chatRouter);   // <-- note: mount at /api/chat, router below uses '/'

const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiKeyYoutube: process.env.GEMINI_API_KEY_YOUTUBE });

// gemini-2.5-flash: best fit for a conversational Q&A chatbot like this one —
// cheap, fast, and well-suited to chat/summarization tasks. Gemini 3.5 Flash
// is newer but ~5x the input cost and aimed at heavy agentic/coding workloads,
// which this app doesn't need.
const MODEL = "gemini-2.5-flash";

const systemPrompt = `You are a specialized AI assistant focused exclusively on leftover food management. Your expertise includes:

1. LEFTOVER RECIPES: Creative and practical recipes using specific leftover ingredients
2. FOOD STORAGE: Proper storage methods, containers, temperatures, and shelf life
3. LEFTOVER MANAGEMENT: Meal planning, portion control, and waste reduction strategies
4. FOOD SAFETY: Guidelines for safely consuming and storing leftover foods

IMPORTANT GUIDELINES:
- Always provide practical, actionable advice
- Include specific timeframes for food safety (e.g., "consume within 3-4 days")
- Suggest creative recipe variations when possible
- Suggest youtube links for visual guidance on cooking techniques or recipes
- Focus on common household ingredients and accessible cooking methods
- Prioritize food safety in all recommendations
- Keep responses concise but comprehensive
- Use friendly, encouraging tone to reduce food waste

Only respond to questions related to leftover food, recipes, storage, and management. If asked about unrelated topics, politely redirect the conversation back to leftover food assistance.`;

router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY_YOUTUBE) {
    console.error("One or both GEMINI_API_KEY(s) are not set in the environment.");
    return res.status(500).json({ error: "Server is not configured correctly." });
  }

  try {
    const response = await ai.models.generateContent({ 
      model: MODEL,
      contents: `${systemPrompt}\n\nUser: ${message}`,
    });

    const text = response.text;

    if (!text) {
      console.error("Unexpected Gemini response shape:", JSON.stringify(response));
      return res.status(502).json({ error: "Received an unexpected response from Gemini." });
    }

    res.json({ text });
  } catch (err) {
    console.error("Gemini API Error:", err);

    // Map SDK errors to the status codes ChatAssistant.jsx checks for
    // (it looks for "400"/"401"/"403"/"429" substrings in error.message).
    const status = err?.status || err?.response?.status;

    if (status === 400) {
      return res.status(400).json({ error: "Invalid request (400). Please check your message." });
    }
    if (status === 401 || status === 403) {
      return res.status(status).json({ error: `Authentication error (${status}). Check the API key.` });
    }
    if (status === 429) {
      return res.status(429).json({ error: "Too many requests (429). Please wait and try again." });
    }

    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;