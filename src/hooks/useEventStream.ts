// /src/hooks/useEventStream.ts

import { useEffect, useRef, useState } from 'react';

export interface StreamEvent {
    type: string;
    sessionId: string;
    timestamp: string;
    data?: any;
    message?: string;
}

export interface UseEventStreamResult {
    isConnected: boolean;
    error: string | null;
    events: StreamEvent[];
    lastEvent: StreamEvent | null;
    connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export function useEventStream(sessionId: string | null): UseEventStreamResult {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [events, setEvents] = useState<StreamEvent[]>([]);
    const [lastEvent, setLastEvent] = useState<StreamEvent | null>(null);
    const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
    
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const cleanup = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    };

    const connect = () => {
        if (!sessionId) return;

        cleanup();
        setConnectionState('connecting');
        setError(null);

        try {
            const eventSource = new EventSource(`/api/events/${sessionId}`);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log(`[SSE] Connected to session ${sessionId}`);
                setIsConnected(true);
                setConnectionState('connected');
                setError(null);
                reconnectAttempts.current = 0;
            };

            eventSource.onmessage = (event) => {
                try {
                    const parsedEvent: StreamEvent = JSON.parse(event.data);
                    console.log(`[SSE] Received event:`, parsedEvent.type, parsedEvent.type === 'page_completed' ? `Page ${parsedEvent.data?.pageNumber || '?'}` : '');
                    
                    setEvents(prev => [...prev, parsedEvent]);
                    setLastEvent(parsedEvent);
                } catch (err) {
                    console.error('[SSE] Failed to parse event data:', err);
                }
            };

            eventSource.onerror = (err) => {
                console.error(`[SSE] Connection error for session ${sessionId}:`, err);
                setIsConnected(false);
                setConnectionState('error');
                setError('Connection error occurred');

                // Attempt to reconnect with exponential backoff
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    const delay = Math.pow(2, reconnectAttempts.current) * 1000; // 1s, 2s, 4s, 8s, 16s
                    console.log(`[SSE] Attempting reconnection in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttempts.current++;
                        connect();
                    }, delay);
                } else {
                    console.error('[SSE] Max reconnection attempts reached');
                    setError('Failed to establish connection after multiple attempts');
                }
            };

        } catch (err) {
            console.error('[SSE] Failed to create EventSource:', err);
            setError('Failed to create connection');
            setConnectionState('error');
        }
    };

    // Connect when sessionId changes
    useEffect(() => {
        if (sessionId) {
            connect();
        } else {
            cleanup();
            setIsConnected(false);
            setConnectionState('disconnected');
            setEvents([]);
            setLastEvent(null);
            setError(null);
        }

        return cleanup;
    }, [sessionId]);

    // Cleanup on unmount
    useEffect(() => {
        return cleanup;
    }, []);

    return {
        isConnected,
        error,
        events,
        lastEvent,
        connectionState,
    };
}