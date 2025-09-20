import React from "react";
import "../styles/ChatAssistant.css";

const ChatAssistant = () => {
  return (
    <div className="chat-assistant-content">
      <iframe
        className="chat-iframe"
        src="https://denser.ai/u/embed/chatbot_qvg2243o333krrn1a3y3q"
        title="DenserAI Chatbot"
      />
    </div>
  );
};

export default ChatAssistant;
