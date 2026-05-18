"use client";
import { useState, useEffect, use } from 'react';
import AgencyAgentWorkspace from '@/app/components/agent/layout/AgencyAgentWorkspace';
import AgentChatPanel from '@/app/components/agent/chat/AgentChatPanel';
import AgentLiveWorkRail from '@/app/components/agent/live-work/AgentLiveWorkRail';
import AgentReviewBar from '@/app/components/agent/layout/AgentReviewBar';
import { useAgentRunStream } from '@/app/hooks/useAgentRunStream';
import { createAgentThread, sendMessage, fetchItineraryDraft } from '@/app/lib/api/index.js';

export default function AgencyAgentPage({ params }) {
  const { agencyId } = use(params);
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
    mapMarkers,
    routeEstimates,
    activeToolLabel,
    lastItineraryUpdate,
    error,
    startStream,
    stopStream,
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
        .then(res => setItinerary(res.itinerary || res))
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
      let activeThreadId = threadId;
      if (!activeThreadId) {
        const threadResult = await createAgentThread(agencyId);
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
          activeToolLabel={activeToolLabel}
          toolCalls={toolCalls}
          onStop={stopStream}
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
        <p>New Trip Agent Session</p>
      </div>
    </AgencyAgentWorkspace>
  );
}
