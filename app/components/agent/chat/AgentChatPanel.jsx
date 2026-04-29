"use client";
import AgentMessageList from './AgentMessageList';
import AgentComposer from './AgentComposer';
import SuggestedPrompts from './SuggestedPrompts';

export default function AgentChatPanel({ 
  messages = [], 
  onSend, 
  isLoading, 
  streamingMessage = '' 
}) {
  const handlePromptSelect = (prompt) => {
    onSend(prompt);
  };

  // Combine static messages with the active streaming message
  const displayMessages = [...messages];
  if (streamingMessage) {
    displayMessages.push({ 
      role: 'assistant', 
      content: streamingMessage, 
      isStreaming: true 
    });
  }

  return (
    <div className="chat-panel-container">
      <div className="chat-messages-area">
        <AgentMessageList messages={displayMessages} />
      </div>
      
      {messages.length < 2 && !streamingMessage && (
        <SuggestedPrompts onSelect={handlePromptSelect} />
      )}

      <div className="chat-input-area">
        <AgentComposer onSend={onSend} isLoading={isLoading} />
      </div>

      <style jsx>{`
        .chat-panel-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
        }

        .chat-messages-area {
          flex-grow: 1;
          overflow-y: hidden;
          display: flex;
          flex-direction: column;
        }

        .chat-input-area {
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
