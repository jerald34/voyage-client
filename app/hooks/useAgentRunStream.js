"use client";
import { useState, useEffect, useRef } from 'react';
import { cancelAgentRun } from '../lib/api.js';

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function humanizeToolName(name) {
  return String(name || '')
    .replace(/[_\.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildActiveToolLabel(tool) {
  const name = String(tool?.name || '').trim();
  const input = tool?.input ?? {};

  if (name === 'map_pinpoint' || name === 'map.pinpoint') {
    const placeName = String(input?.placeName || input?.name || '').trim();
    if (placeName) return `Geocoding ${placeName}...`;
    return 'Geocoding location...';
  }

  if (name === 'route_logistics' || name === 'route.estimate' || name === 'route') {
    const origin = String(input?.originPlaceName || input?.origin?.name || '').trim();
    const destination = String(input?.destinationPlaceName || input?.destination?.name || '').trim();
    if (origin && destination) return `Computing route logistics: ${origin} -> ${destination}...`;
    return 'Computing route logistics...';
  }

  const displayName = humanizeToolName(name);
  if (displayName) {
    return `${displayName}...`;
  }

  return 'Running tool...';
}

function normalizeMapMarker(payload, index) {
  const lat = toNumber(payload?.lat ?? payload?.latitude);
  const lng = toNumber(payload?.lng ?? payload?.longitude);

  if (lat == null || lng == null) {
    return null;
  }

  const name = String(payload?.name || payload?.title || payload?.formattedAddress || payload?.address || `Resolved location ${index + 1}`).trim();
  const formattedAddress = String(payload?.formattedAddress || payload?.address || '').trim();

  return {
    id: String(payload?.id || payload?.placeSnapshotId || `${name}-${lat}-${lng}-${index}`),
    name,
    formattedAddress,
    lat,
    lng,
    provider: payload?.provider ?? null,
  };
}

function normalizeRouteEstimate(payload, index) {
  if (!payload) {
    return null;
  }

  return {
    id: String(payload?.id || `route-${index}-${Date.now()}`),
    origin: payload?.origin ?? null,
    destination: payload?.destination ?? null,
    distanceMeters: toNumber(payload?.distanceMeters),
    durationSeconds: toNumber(payload?.durationSeconds),
    staticDurationSeconds: toNumber(payload?.staticDurationSeconds),
    travelMode: payload?.travelMode ?? null,
    polyline: payload?.polyline ?? null,
  };
}

// Reducer helpers for granular itinerary streaming events. They patch a cached itinerary in place
// so the existing rich-itinerary renderer can re-render smoothly without a full re-fetch on every event.
function patchDayItems(itinerary, dayId, mapItems) {
  if (!itinerary || !Array.isArray(itinerary.days)) return itinerary;
  const days = itinerary.days.map((day) => {
    if (day?.id !== dayId) return day;
    const items = Array.isArray(day.items) ? day.items : [];
    return { ...day, items: mapItems(items) };
  });
  return { ...itinerary, days };
}

function applyItineraryItemAdded(itinerary, payload) {
  return patchDayItems(itinerary, payload?.dayId, (items) => {
    if (!payload?.item) return items;
    const exists = items.some((item) => item?.id && item.id === payload.item.id);
    if (exists) {
      return items.map((item) => (item?.id === payload.item.id ? payload.item : item));
    }
    return [...items, payload.item].sort(
      (a, b) => (Number(a?.sortOrder ?? 0) - Number(b?.sortOrder ?? 0)),
    );
  });
}

function applyItineraryItemUpdated(itinerary, payload) {
  if (!payload?.item) return itinerary;
  return patchDayItems(itinerary, payload?.dayId, (items) =>
    items.map((item) => (item?.id === payload.item.id ? { ...item, ...payload.item } : item)),
  );
}

function applyItineraryItemRemoved(itinerary, payload) {
  if (!itinerary) return itinerary;
  if (Array.isArray(payload?.items)) {
    return patchDayItems(itinerary, payload.dayId, () => payload.items);
  }
  return patchDayItems(itinerary, payload?.dayId, (items) =>
    items.filter((item) => item?.id !== payload?.itemId),
  );
}

function applyItineraryItemMoved(itinerary, payload) {
  if (!itinerary || !Array.isArray(itinerary.days)) return itinerary;
  const days = itinerary.days.map((day) => {
    if (day?.id === payload?.fromDayId && Array.isArray(payload?.fromItems)) {
      return { ...day, items: payload.fromItems };
    }
    if (day?.id === payload?.toDayId && Array.isArray(payload?.toItems)) {
      return { ...day, items: payload.toItems };
    }
    return day;
  });
  return { ...itinerary, days };
}

function applyItineraryDayAdded(itinerary, payload) {
  if (!itinerary || !payload?.day) return itinerary;
  const days = Array.isArray(itinerary.days) ? itinerary.days : [];
  const exists = days.some((day) => day?.id === payload.day.id);
  const next = exists
    ? days.map((day) => (day?.id === payload.day.id ? payload.day : day))
    : [...days, payload.day];
  next.sort((a, b) => Number(a?.dayNumber ?? 0) - Number(b?.dayNumber ?? 0));
  return { ...itinerary, days: next };
}

function applyItineraryDayUpdated(itinerary, payload) {
  if (!itinerary || !payload?.day) return itinerary;
  const days = Array.isArray(itinerary.days) ? itinerary.days : [];
  return {
    ...itinerary,
    days: days.map((day) => (day?.id === payload.day.id ? { ...day, ...payload.day } : day)),
  };
}

function applyItineraryDayRemoved(itinerary, payload) {
  if (!itinerary) return itinerary;
  if (Array.isArray(payload?.days)) {
    return { ...itinerary, days: payload.days };
  }
  return {
    ...itinerary,
    days: (itinerary.days || []).filter((day) => day?.id !== payload?.dayId),
  };
}

export function useAgentRunStream(agencyId) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [runStatus, setRunStatus] = useState('idle'); // idle, running, completed, failed
  const [assistantMessage, setAssistantMessage] = useState('');
  const [tasks, setTasks] = useState([]);
  const [toolCalls, setToolCalls] = useState([]);
  const [sources, setSources] = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [routeEstimates, setRouteEstimates] = useState([]);
  const [activeToolLabel, setActiveToolLabel] = useState(null);
  const [lastItineraryUpdate, setLastItineraryUpdate] = useState(null);
  const [lastCompletedItineraryTool, setLastCompletedItineraryTool] = useState(null);
  const [completedMessageContent, setCompletedMessageContent] = useState(null);
  // streamingItinerary is the in-flight cached itinerary patched by granular events.
  const [streamingItinerary, setStreamingItinerary] = useState(null);
  const [error, setError] = useState(null);

  const eventSourceRef = useRef(null);
  const streamInstanceRef = useRef(0);
  const currentRunIdRef = useRef(null);

  const startStream = (runId) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    currentRunIdRef.current = runId;
    const streamInstanceId = ++streamInstanceRef.current;

    setIsStreaming(true);
    setRunStatus('running');
    setAssistantMessage('');
    setTasks([]);
    setToolCalls([]);
    setSources([]);
    setMapMarkers([]);
    setRouteEstimates([]);
    setActiveToolLabel(null);
    setLastItineraryUpdate(null);
    setLastCompletedItineraryTool(null);
    setCompletedMessageContent(null);
    setStreamingItinerary(null);
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
        setCompletedMessageContent(data.payload.content);
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

      // Clear intermediate streaming content so it doesn't concatenate with
      // the post-tool synthesis output that will arrive later.
      setAssistantMessage('');
      setToolCalls(prev => [...prev, { ...tool, status: 'Running' }]);
      setActiveToolLabel(buildActiveToolLabel(tool));
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
      setActiveToolLabel(null);

      if (tool.name === 'create_itinerary' || tool.name === 'update_itinerary') {
        setLastCompletedItineraryTool({
          ...tool,
          receivedAt: Date.now()
        });
      }
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
      setActiveToolLabel(null);
    });

    // Server sends: { type: "map.pinpointed", payload: { placeSnapshotId, name, formattedAddress, lat, lng, provider } }
    es.addEventListener('map.pinpointed', (e) => {
      if (!isCurrentStream()) return;

      const data = parseEventData(e);
      setMapMarkers(prev => {
        const marker = normalizeMapMarker(data?.payload, prev.length);
        if (!marker) return prev;
        return [...prev, marker];
      });
    });

    // Server sends: { type: "route.estimated", payload: { origin, destination, distanceMeters, durationSeconds, polyline } }
    es.addEventListener('route.estimated', (e) => {
      if (!isCurrentStream()) return;

      const data = parseEventData(e);
      setRouteEstimates(prev => {
        const routeEstimate = normalizeRouteEstimate(data?.payload, prev.length);
        if (!routeEstimate) return prev;
        return [...prev, routeEstimate];
      });
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

    // Server sends: { type: "itinerary.created", payload: { itineraryId, version, status, itinerary } }
    es.addEventListener('itinerary.created', (e) => {
      if (!isCurrentStream()) return;

      const data = parseEventData(e);
      const payload = data?.payload;
      if (!payload?.itineraryId) return;
      setLastItineraryUpdate(payload.itineraryId);
      if (payload.itinerary) {
        setStreamingItinerary(payload.itinerary);
      }
    });

    // Server sends: { type: "itinerary.deleted", payload: { itineraryId, tripDeleted } }
    es.addEventListener('itinerary.deleted', (e) => {
      if (!isCurrentStream()) return;

      const data = parseEventData(e);
      setLastItineraryUpdate(data?.payload?.itineraryId || null);
      setStreamingItinerary(null);
    });

    // Granular streaming reducers patch the cached itinerary in place so the UI lights up
    // card-by-card as the agent populates the trip.
    es.addEventListener('itinerary.item.added', (e) => {
      if (!isCurrentStream()) return;
      const data = parseEventData(e);
      const payload = data?.payload;
      if (!payload?.itineraryId) return;
      setLastItineraryUpdate(payload.itineraryId);
      setStreamingItinerary((prev) => applyItineraryItemAdded(prev, payload));
    });

    es.addEventListener('itinerary.item.updated', (e) => {
      if (!isCurrentStream()) return;
      const data = parseEventData(e);
      const payload = data?.payload;
      if (!payload?.itineraryId) return;
      setLastItineraryUpdate(payload.itineraryId);
      setStreamingItinerary((prev) => applyItineraryItemUpdated(prev, payload));
    });

    es.addEventListener('itinerary.item.removed', (e) => {
      if (!isCurrentStream()) return;
      const data = parseEventData(e);
      const payload = data?.payload;
      if (!payload?.itineraryId) return;
      setLastItineraryUpdate(payload.itineraryId);
      setStreamingItinerary((prev) => applyItineraryItemRemoved(prev, payload));
    });

    es.addEventListener('itinerary.item.moved', (e) => {
      if (!isCurrentStream()) return;
      const data = parseEventData(e);
      const payload = data?.payload;
      if (!payload?.itineraryId) return;
      setLastItineraryUpdate(payload.itineraryId);
      setStreamingItinerary((prev) => applyItineraryItemMoved(prev, payload));
    });

    es.addEventListener('itinerary.day.added', (e) => {
      if (!isCurrentStream()) return;
      const data = parseEventData(e);
      const payload = data?.payload;
      if (!payload?.itineraryId) return;
      setLastItineraryUpdate(payload.itineraryId);
      setStreamingItinerary((prev) => applyItineraryDayAdded(prev, payload));
    });

    es.addEventListener('itinerary.day.updated', (e) => {
      if (!isCurrentStream()) return;
      const data = parseEventData(e);
      const payload = data?.payload;
      if (!payload?.itineraryId) return;
      setLastItineraryUpdate(payload.itineraryId);
      setStreamingItinerary((prev) => applyItineraryDayUpdated(prev, payload));
    });

    es.addEventListener('itinerary.day.removed', (e) => {
      if (!isCurrentStream()) return;
      const data = parseEventData(e);
      const payload = data?.payload;
      if (!payload?.itineraryId) return;
      setLastItineraryUpdate(payload.itineraryId);
      setStreamingItinerary((prev) => applyItineraryDayRemoved(prev, payload));
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
      setActiveToolLabel(null);
      finishStream();
    });

    // Server sends: { type: "run.failed", payload: { code, message } }
    es.addEventListener('run.failed', (e) => {
      if (!isCurrentStream()) return;

      const data = parseEventData(e);
      setIsStreaming(false);
      setRunStatus('failed');
      setActiveToolLabel(null);
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

  const stopStream = () => {
    const runId = currentRunIdRef.current;
    if (runId) {
      cancelAgentRun(agencyId, runId).catch(() => {});
      currentRunIdRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    streamInstanceRef.current += 1;
    setIsStreaming(false);
    setRunStatus('idle');
    setActiveToolLabel(null);
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
    completedMessageContent,
    tasks,
    toolCalls,
    sources,
    mapMarkers,
    routeEstimates,
    activeToolLabel,
    lastItineraryUpdate,
    lastCompletedItineraryTool,
    streamingItinerary,
    error,
    startStream,
    stopStream,
  };
}
