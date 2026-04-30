"use client";
import { useState, useEffect, useRef } from 'react';

export function useAgentRunStream(agencyId) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [runStatus, setRunStatus] = useState('idle'); // idle, running, completed, failed
  const [assistantMessage, setAssistantMessage] = useState('');
  const [tasks, setTasks] = useState([]);
  const [toolCalls, setToolCalls] = useState([]);
  const [sources, setSources] = useState([]);
  const [lastItineraryUpdate, setLastItineraryUpdate] = useState(null);
  const [error, setError] = useState(null);

  const eventSourceRef = useRef(null);

  const startStream = (runId) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsStreaming(true);
    setRunStatus('running');
    setAssistantMessage('');
    setTasks([]);
    setToolCalls([]);
    setSources([]);
    setError(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const url = `${API_URL}/agencies/${agencyId}/agent/runs/${runId}/stream`;

    // EventSource withCredentials ensures cookies are sent for auth
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    // Server sends: { type: "message.delta", payload: { delta: "..." } }
    es.addEventListener('message.delta', (e) => {
      try {
        const data = JSON.parse(e.data);
        setAssistantMessage(prev => prev + (data.payload?.delta || ''));
      } catch (err) {
        console.error('Error parsing message.delta:', err);
      }
    });

    // Server sends: { type: "message.completed", payload: { messageId, content } }
    es.addEventListener('message.completed', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.payload?.content) {
          setAssistantMessage(data.payload.content);
        }
      } catch (err) {
        console.error('Error parsing message.completed:', err);
      }
    });

    // Server sends: { type: "task.updated", payload: { label, status, sortOrder } }
    es.addEventListener('task.updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        const task = data.payload;
        if (!task) return;
        setTasks(prev => {
          const existingIndex = prev.findIndex(t => t.label === task.label);
          if (existingIndex > -1) {
            const newTasks = [...prev];
            newTasks[existingIndex] = { ...newTasks[existingIndex], ...task };
            return newTasks;
          }
          return [...prev, task];
        });
      } catch (err) {
        console.error('Error parsing task.updated:', err);
      }
    });

    // Server sends: { type: "tool.started", payload: { name, input } }
    es.addEventListener('tool.started', (e) => {
      try {
        const data = JSON.parse(e.data);
        const tool = data.payload;
        if (!tool) return;
        setToolCalls(prev => [...prev, { ...tool, status: 'Running' }]);
      } catch (err) {
        console.error('Error parsing tool.started:', err);
      }
    });

    // Server sends: { type: "tool.completed", payload: { name, output } }
    es.addEventListener('tool.completed', (e) => {
      try {
        const data = JSON.parse(e.data);
        const tool = data.payload;
        if (!tool) return;
        setToolCalls(prev => prev.map(t =>
          t.name === tool.name && t.status === 'Running'
            ? { ...t, ...tool, status: 'Completed' }
            : t
        ));
      } catch (err) {
        console.error('Error parsing tool.completed:', err);
      }
    });

    // Server sends: { type: "tool.failed", payload: { name, code, message } }
    es.addEventListener('tool.failed', (e) => {
      try {
        const data = JSON.parse(e.data);
        const tool = data.payload;
        if (!tool) return;
        setToolCalls(prev => prev.map(t =>
          t.name === tool.name && t.status === 'Running'
            ? { ...t, ...tool, status: 'Failed' }
            : t
        ));
      } catch (err) {
        console.error('Error parsing tool.failed:', err);
      }
    });

    // Server sends: { type: "source.added", payload: { sourceType, title, url, snippet } }
    es.addEventListener('source.added', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.payload) {
          setSources(prev => [...prev, data.payload]);
        }
      } catch (err) {
        console.error('Error parsing source.added:', err);
      }
    });

    // Server sends: { type: "itinerary.updated", payload: { itineraryId, ... } }
    es.addEventListener('itinerary.updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        setLastItineraryUpdate(data.payload?.itineraryId || null);
      } catch (err) {
        console.error('Error parsing itinerary.updated:', err);
      }
    });

    // Server sends: { type: "run.started", payload: { runId } }
    es.addEventListener('run.started', () => {
      setRunStatus('running');
    });

    // Server sends: { type: "run.completed", payload: { runId } }
    es.addEventListener('run.completed', () => {
      setIsStreaming(false);
      setRunStatus('completed');
      es.close();
    });

    // Server sends: { type: "run.failed", payload: { code, message } }
    es.addEventListener('run.failed', (e) => {
      try {
        const data = JSON.parse(e.data);
        setIsStreaming(false);
        setRunStatus('failed');
        setError(data.payload?.message || 'Agent run failed');
        es.close();
      } catch (err) {
        console.error('Error parsing run.failed:', err);
        setIsStreaming(false);
        setRunStatus('failed');
        es.close();
      }
    });

    es.onerror = (err) => {
      // EventSource will automatically attempt to reconnect on many errors.
      // We'll log it for debugging.
      console.debug('SSE Connection issue:', err);
    };
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    isStreaming,
    runStatus,
    assistantMessage,
    tasks,
    toolCalls,
    sources,
    lastItineraryUpdate,
    error,
    startStream
  };
}
