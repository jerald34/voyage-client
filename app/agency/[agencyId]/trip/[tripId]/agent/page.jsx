"use client";
import { useState, useEffect, use } from 'react';
import AgencyAgentWorkspace from '@/app/components/agent/layout/AgencyAgentWorkspace';
import AgentChatPanel from '@/app/components/agent/chat/AgentChatPanel';
import AgentLiveWorkRail from '@/app/components/agent/live-work/AgentLiveWorkRail';
import AgentReviewBar from '@/app/components/agent/layout/AgentReviewBar';
import { useAgentRunStream } from '@/app/hooks/useAgentRunStream';
import { createAgentThread, sendMessage, fetchItineraryDraft } from '@/app/lib/api';

export default function AgencyTripAgentPage({ params }) {
  const { agencyId, tripId } = use(params);
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
    mapMarkers,
    routeEstimates,
    activeToolLabel,
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
        .then(res => setItinerary(res.itinerary || res))
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
      let activeThreadId = threadId;
      if (!activeThreadId) {
        const threadResult = await createAgentThread(agencyId, tripId);
        activeThreadId = threadResult.thread.id;
        setThreadId(activeThreadId);
      }
      const result = await sendMessage(agencyId, activeThreadId, content);
      const runId = result.runId || result.run?.id;
      if (runId) {
        startStream(runId);
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
          activeToolLabel={activeToolLabel}
          mapMarkers={mapMarkers}
          routeEstimates={routeEstimates}
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
