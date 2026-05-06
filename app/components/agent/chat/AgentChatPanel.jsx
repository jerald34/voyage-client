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
  const hasStreamingMessage = typeof streamingMessage === 'string' && streamingMessage.length > 0;
  const latestAssistantMessage = [...messages].reverse().find((message) => message?.role === 'assistant');
  const shouldShowStreamingBubble = hasStreamingMessage && latestAssistantMessage?.content !== streamingMessage;

  if (shouldShowStreamingBubble) {
    const lastMessage = displayMessages[displayMessages.length - 1];

    if (lastMessage?.role === 'assistant' && lastMessage?.isStreaming) {
      displayMessages[displayMessages.length - 1] = {
        ...lastMessage,
        content: streamingMessage,
        isStreaming: true
      };
    } else {
      displayMessages.push({
        role: 'assistant',
        content: streamingMessage,
        isStreaming: true,
        time: 'Live'
      });
    }
  }

  return (
    <div className="chat-panel-container">
      <div className="chat-messages-area">
        <AgentMessageList
          messages={displayMessages}
          isStreaming={shouldShowStreamingBubble}
        />
      </div>
      
      {messages.length < 2 && !shouldShowStreamingBubble && (
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
