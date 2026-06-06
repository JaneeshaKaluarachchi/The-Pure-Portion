import React, { useState, useEffect, useRef } from "react";
import "../styles/chatbot.css";

const ChatAssistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: `Hello! I'm your Leftover Food Assistant. I can help you with:
      
• 🍳 Creative recipes using leftover ingredients
• 📦 Proper food storage tips
• ⏰ Leftover management strategies
• 🥗 Food safety guidelines

What leftover food question can I help you with today?`,
      type: "bot",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ⚠️ For production, move this API key to a backend server instead of frontend!
  const API_KEY = "YOUR_API_KEY_HERE";
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

  const systemPrompt = `You are a specialized AI assistant focused exclusively on leftover food management. Your expertise includes:

1. LEFTOVER RECIPES: Creative and practical recipes using specific leftover ingredients
2. FOOD STORAGE: Proper storage methods, containers, temperatures, and shelf life
3. LEFTOVER MANAGEMENT: Meal planning, portion control, and waste reduction strategies
4. FOOD SAFETY: Guidelines for safely consuming and storing leftover foods

IMPORTANT GUIDELINES:
- Always provide practical, actionable advice
- Include specific timeframes for food safety (e.g., "consume within 3-4 days")
- Suggest creative recipe variations when possible
- Focus on common household ingredients and accessible cooking methods
- Prioritize food safety in all recommendations
- Keep responses concise but comprehensive
- Use friendly, encouraging tone to reduce food waste

Only respond to questions related to leftover food, recipes, storage, and management. If asked about unrelated topics, politely redirect the conversation back to leftover food assistance.`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatBotMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>")
      .replace(/^- (.*$)/gim, "<li>$1</li>")
      .replace(/^\d+\. (.*$)/gim, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
  };

  const getGeminiResponse = async (userMessage) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userMessage })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Unknown error');
  }

  const data = await response.json();
  return data.text;
};

  const handleSendMessage = async () => {
    const message = inputValue.trim();
    if (!message || isLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      content: message,
      type: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await getGeminiResponse(message);

      const botMessage = {
        id: Date.now() + 1,
        content: response,
        type: "bot",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot Error:", error);

      let errorMessage = "Sorry, I encountered an error. Please try again.";

      if (error.message.includes("API Error: 400")) {
        errorMessage = "Invalid request. Please check your message and try again.";
      } else if (error.message.includes("API Error: 401")) {
        errorMessage = "Authentication error. Please check the API key configuration.";
      } else if (error.message.includes("API Error: 429")) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "Network error. Please check your internet connection.";
      }

      const errorBotMessage = {
        id: Date.now() + 1,
        content: errorMessage,
        type: "error",
      };

      setMessages((prev) => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-assistant-content">
      <div className="chatbot-container">
        <div className="chatbot-header">
          <h2>🍽️ Leftover Food Assistant</h2>
          <p>Get tips, recipes, and management advice for your leftover food</p>
        </div>

        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}-message`}>
              <div className="message-content">
                {message.type === "bot" || message.type === "error" ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: formatBotMessage(message.content) }}
                  />
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <div className="input-group">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about leftover recipes, storage tips, or management..."
              maxLength={500}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              type="button"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
