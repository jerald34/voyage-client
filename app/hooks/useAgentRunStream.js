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

    es.addEventListener('message.delta', (e) => {
      try {
        const data = JSON.parse(e.data);
        setAssistantMessage(prev => prev + (data.delta || ''));
      } catch (err) {
        console.error('Error parsing message.delta:', err);
      }
    });

    es.addEventListener('task.updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        setTasks(prev => {
          const existingIndex = prev.findIndex(t => t.id === data.id);
          if (existingIndex > -1) {
            const newTasks = [...prev];
            newTasks[existingIndex] = { ...newTasks[existingIndex], ...data };
            return newTasks;
          }
          return [...prev, data];
        });
      } catch (err) {
        console.error('Error parsing task.updated:', err);
      }
    });

    es.addEventListener('tool.started', (e) => {
      try {
        const data = JSON.parse(e.data);
        setToolCalls(prev => [...prev, { ...data, status: 'Running' }]);
      } catch (err) {
        console.error('Error parsing tool.started:', err);
      }
    });

    es.addEventListener('tool.completed', (e) => {
      try {
        const data = JSON.parse(e.data);
        setToolCalls(prev => prev.map(t => t.id === data.id ? { ...t, ...data, status: 'Completed' } : t));
      } catch (err) {
        console.error('Error parsing tool.completed:', err);
      }
    });

    es.addEventListener('tool.failed', (e) => {
      try {
        const data = JSON.parse(e.data);
        setToolCalls(prev => prev.map(t => t.id === data.id ? { ...t, ...data, status: 'Failed' } : t));
      } catch (err) {
        console.error('Error parsing tool.failed:', err);
      }
    });

    es.addEventListener('source.added', (e) => {
      try {
        const data = JSON.parse(e.data);
        setSources(prev => [...prev, data]);
      } catch (err) {
        console.error('Error parsing source.added:', err);
      }
    });

    es.addEventListener('itinerary.updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        setLastItineraryUpdate(data.itineraryId);
      } catch (err) {
        console.error('Error parsing itinerary.updated:', err);
      }
    });

    es.addEventListener('run.completed', () => {
      setIsStreaming(false);
      setRunStatus('completed');
      es.close();
    });

    es.addEventListener('run.failed', (e) => {
      try {
        const data = JSON.parse(e.data);
        setIsStreaming(false);
        setRunStatus('failed');
        setError(data.error || 'Agent run failed');
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
