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
  const streamInstanceRef = useRef(0);

  const startStream = (runId) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const streamInstanceId = ++streamInstanceRef.current;

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

    const isCurrentStream = () => {
      return streamInstanceRef.current === streamInstanceId && eventSourceRef.current === es;
    };

    const parseEventData = (event) => {
      try {
        return JSON.parse(event.data);
      } catch (err) {
        console.error('Error parsing SSE event:', err);
        return null;
      }
    };

    const finishStream = () => {
      if (eventSourceRef.current === es) {
        eventSourceRef.current = null;
      }
      streamInstanceRef.current += 1;
      es.close();
    };

    // Server sends: { type: "message.delta", payload: { delta: "..." } }
    es.addEventListener('message.delta', (e) => {
      if (!isCurrentStream()) return;

      const data = parseEventData(e);
      if (!data) return;

      const delta = data.payload?.delta;
      if (delta == null) return;

      setAssistantMessage(prev => prev + String(delta));
    });

    // Server sends: { type: "message.completed", payload: { messageId, content } }
    es.addEventListener('message.completed', (e) => {
      if (!isCurrentStream()) return;

      const data = parseEventData(e);
      if (!data) return;

      if (typeof data.payload?.content === 'string') {
        setAssistantMessage(data.payload.content);
      }
    });

    // Server sends: { type: "task.updated", payload: { label, status, sortOrder } }
    es.addEventListener('task.updated', (e) => {
      if (!isCurrentStream()) return;

      const data = parseEventData(e);
      const task = data?.payload;
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
    });

    // Server sends: { type: "tool.started", payload: { name, input } }
    es.addEventListener('tool.started', (e) => {
      if (!isCurrentStream()) return;

      const data = parseEventData(e);
      const tool = data?.payload;
      if (!tool) return;

      setToolCalls(prev => [...prev, { ...tool, status: 'Running' }]);
    });

    // Server sends: { type: "tool.completed", payload: { name, output } }
    es.addEventListener('tool.completed', (e) => {
      if (!isCurrentStream()) return;

      const data = parseEventData(e);
      const tool = data?.payload;
      if (!tool) return;

      setToolCalls(prev => prev.map(t =>
        t.name === tool.name && t.status === 'Running'
          ? { ...t, ...tool, status: 'Completed' }
          : t
      ));
    });

    // Server sends: { type: "tool.failed", payload: { name, code, message } }
    es.addEventListener('tool.failed', (e) => {
      if (!isCurrentStream()) return;

      const data = parseEventData(e);
      const tool = data?.payload;
      if (!tool) return;

      setToolCalls(prev => prev.map(t =>
        t.name === tool.name && t.status === 'Running'
          ? { ...t, ...tool, status: 'Failed' }
          : t
      ));
    });

    // Server sends: { type: "source.added", payload: { sourceType, title, url, snippet } }
    es.addEventListener('source.added', (e) => {
      if (!isCurrentStream()) return;

      const data = parseEventData(e);
      if (data.payload) {
        setSources(prev => [...prev, data.payload]);
      }
    });

    // Server sends: { type: "itinerary.updated", payload: { itineraryId, ... } }
    es.addEventListener('itinerary.updated', (e) => {
      if (!isCurrentStream()) return;

      const data = parseEventData(e);
      setLastItineraryUpdate(data?.payload?.itineraryId || null);
    });

    // Server sends: { type: "run.started", payload: { runId } }
    es.addEventListener('run.started', () => {
      if (!isCurrentStream()) return;

      setRunStatus('running');
    });

    // Server sends: { type: "run.completed", payload: { runId } }
    es.addEventListener('run.completed', () => {
      if (!isCurrentStream()) return;

      setIsStreaming(false);
      setRunStatus('completed');
      finishStream();
    });

    // Server sends: { type: "run.failed", payload: { code, message } }
    es.addEventListener('run.failed', (e) => {
      if (!isCurrentStream()) return;

      const data = parseEventData(e);
      setIsStreaming(false);
      setRunStatus('failed');
      setError(data?.payload?.message || 'Agent run failed');
      finishStream();
    });

    es.onerror = (err) => {
      // EventSource will automatically attempt to reconnect on many errors.
      // Keep the stream state alive during transient reconnects and only
      // surface a failure if the browser has actually closed the connection.
      if (!isCurrentStream()) return;

      console.debug('SSE Connection issue:', err);

      if (es.readyState === EventSource.CLOSED) {
        setIsStreaming(false);
        setRunStatus('failed');
        setError('Connection lost while streaming the agent response');
        finishStream();
      }
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
