"use client";
import { useState, useEffect } from 'react';
import AgencyAgentWorkspace from '@/app/components/agent/layout/AgencyAgentWorkspace';
import AgentChatPanel from '@/app/components/agent/chat/AgentChatPanel';
import AgentLiveWorkRail from '@/app/components/agent/live-work/AgentLiveWorkRail';
import AgentReviewBar from '@/app/components/agent/layout/AgentReviewBar';
import { useAgentRunStream } from '@/app/hooks/useAgentRunStream';
import { sendMessage, fetchItineraryDraft } from '@/app/lib/api';

export default function AgencyTripAgentPage({ params }) {
  const { agencyId, tripId } = params;
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Hello! I am ready to help with your itinerary for this trip. Describe what you have in mind.', 
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

  // If the run completes, move the assistant message to the static list
  useEffect(() => {
    if (runStatus === 'completed' && assistantMessage) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantMessage, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    }
  }, [runStatus, assistantMessage]);

  // If the itinerary updates, fetch the new state
  useEffect(() => {
    if (lastItineraryUpdate) {
      fetchItineraryDraft(agencyId, lastItineraryUpdate)
        .then(setItinerary)
        .catch(err => console.error('Failed to fetch itinerary:', err));
    }
  }, [lastItineraryUpdate, agencyId]);

  const handleSend = async (content) => {
    // Add user message immediately
    const userMsg = { 
      role: 'user', 
      content, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // 1. Send message to backend
      // Note: tripId is passed to associate the thread if it's new
      const result = await sendMessage(agencyId, threadId || `new-trip-${tripId}`, content);
      
      // 2. Start streaming the run returned by the message
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
        <p>Trip ID: {tripId}</p>
      </div>
    </AgencyAgentWorkspace>
  );
}
