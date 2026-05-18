"use client";
import { useState, useEffect, use } from 'react';
import AgencyAgentWorkspace from '@/app/components/agent/layout/AgencyAgentWorkspace';
import AgentChatPanel from '@/app/components/agent/chat/AgentChatPanel';
import AgentLiveWorkRail from '@/app/components/agent/live-work/AgentLiveWorkRail';
import AgentReviewBar from '@/app/components/agent/layout/AgentReviewBar';
import { useAgentRunStream } from '@/app/hooks/useAgentRunStream';
import { createAgentThread, sendMessage, uploadChatImages, fetchItineraryDraft } from '@/app/lib/api/index.js';
import useImageAttachments from '@/app/hooks/useImageAttachments';

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
  const imageAttachments = useImageAttachments();

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

  const handleSend = async (content, imageFiles = []) => {
    const hasImages = Array.isArray(imageFiles) && imageFiles.length > 0;
    const messageContent = content || (hasImages ? "Sent image(s)" : "");

    try {
      // Ensure we have a thread before uploading images
      let activeThreadId = threadId;
      if (!activeThreadId) {
        const threadResult = await createAgentThread(agencyId, tripId);
        activeThreadId = threadResult.thread.id;
        setThreadId(activeThreadId);
      }

      // Upload images if any
      let imageUrls = [];
      if (hasImages) {
        const uploadResult = await uploadChatImages(agencyId, activeThreadId, imageFiles);
        imageUrls = (uploadResult.images || []).map((img) => img.url);
      }

      // Optimistic message update
      const metadata = imageUrls.length > 0 ? { imageUrls } : undefined;
      const userMsg = {
        role: 'user',
        content: messageContent,
        metadata,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, userMsg]);
      imageAttachments.clear();

      const result = await sendMessage(agencyId, activeThreadId, messageContent, imageUrls);
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
          attachments={imageAttachments.attachments}
          onAddFiles={imageAttachments.addFiles}
          onRemoveAttachment={imageAttachments.removeAttachment}
          fileInputRef={imageAttachments.fileInputRef}
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
