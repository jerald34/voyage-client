"use client";
import { useState, useEffect } from 'react';
import AgencyAgentWorkspace from '@/app/components/agent/layout/AgencyAgentWorkspace';
import AgentChatPanel from '@/app/components/agent/chat/AgentChatPanel';
import AgentLiveWorkRail from '@/app/components/agent/live-work/AgentLiveWorkRail';
import AgentReviewBar from '@/app/components/agent/layout/AgentReviewBar';
import { useAgentRunStream } from '@/app/hooks/useAgentRunStream';
import { sendMessage, fetchItineraryDraft } from '@/app/lib/api';

export default function AgencyAgentPage({ params }) {
  const { agencyId } = params;
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Hello! I am your Voyage Agent. I can help you research, draft, and refine your travel itineraries. What are we planning today?', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  const [itinerary, setItinerary] = useState(null);
  const [threadId, setThreadId] = useState(null);

  const {
    isStreaming,
    runStatus,
    assistantMessage,
    tasks,
    toolCalls,
    sources,
    lastItineraryUpdate,
    error,
    startStream
  } = useAgentRunStream(agencyId);

  useEffect(() => {
    if (runStatus === 'completed' && assistantMessage) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantMessage, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    }
  }, [runStatus, assistantMessage]);

  useEffect(() => {
    if (lastItineraryUpdate) {
      fetchItineraryDraft(agencyId, lastItineraryUpdate)
        .then(setItinerary)
        .catch(err => console.error('Failed to fetch itinerary:', err));
    }
  }, [lastItineraryUpdate, agencyId]);

  const handleSend = async (content) => {
    const userMsg = { 
      role: 'user', 
      content, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const result = await sendMessage(agencyId, threadId || 'new', content);
      if (result.runId) {
        startStream(result.runId);
      }
      if (result.threadId) {
        setThreadId(result.threadId);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <AgencyAgentWorkspace
      chatPanel={
        <AgentChatPanel 
          messages={messages} 
          onSend={handleSend} 
          isLoading={isStreaming} 
          streamingMessage={assistantMessage} 
        />
      }
      liveWorkPanel={
        <AgentLiveWorkRail 
          runStatus={runStatus}
          tasks={tasks}
          toolCalls={toolCalls}
          sources={sources}
          itinerary={itinerary}
        />
      }
      inspectorFooter={
        <AgentReviewBar />
      }
    >
      <div className="hidden">
        <p>Agency ID: {agencyId}</p>
        <p>New Trip Agent Session</p>
      </div>
    </AgencyAgentWorkspace>
  );
}
