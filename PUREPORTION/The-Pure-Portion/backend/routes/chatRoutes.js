const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemPrompt = `You are a specialized AI assistant focused exclusively on leftover food management...`;

router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001', // ✅ use a model listed from listModels()
      contents: `${systemPrompt}\n\nUser: ${message}`,
    });

    res.json({ text: response.text || 'No response from Gemini' });
  } catch (err) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
