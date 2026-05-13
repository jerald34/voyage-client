"use client";
import { useState } from 'react';
import AgentMessageList from './AgentMessageList';
import AgentComposer from './AgentComposer';
import SuggestedPrompts from './SuggestedPrompts';

export default function AgentChatPanel({
  messages = [],
  onSend,
  isLoading,
  streamingMessage = '',
  activeToolLabel = null,
  toolCalls = [],
  onStop,
}) {
  const [editState, setEditState] = useState(null); // { content, version }

  const handleEditMessage = (content) => {
    setEditState(prev => ({ content, version: (prev?.version ?? 0) + 1 }));
  };

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
        isStreaming: true,
      };
    } else {
      displayMessages.push({
        role: 'assistant',
        content: streamingMessage,
        isStreaming: true,
        time: 'Live',
      });
    }
  }

  const showThinking = isLoading && !shouldShowStreamingBubble;

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-grow overflow-y-hidden flex flex-col">
        <AgentMessageList
          messages={displayMessages}
          isStreaming={shouldShowStreamingBubble}
          showThinking={showThinking}
          activeToolLabel={activeToolLabel}
          toolCalls={toolCalls}
          onEditMessage={handleEditMessage}
        />
      </div>

      {messages.length < 2 && !shouldShowStreamingBubble && !showThinking && (
        <SuggestedPrompts onSelect={(prompt) => onSend(prompt)} />
      )}

      <div className="flex-shrink-0">
        <AgentComposer
          onSend={(content) => {
            setEditState(null);
            onSend(content);
          }}
          isLoading={isLoading}
          onStop={onStop}
          editMessage={editState}
        />
      </div>
    </div>
  );
}
