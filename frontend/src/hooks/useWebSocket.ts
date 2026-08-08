import { useEffect, useRef } from 'react';

export function useWebSocket(userId: string | undefined, onMessage: (msg: any) => void) {
  const ws = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!userId) return;

    // Use ws:// for local development, wss:// in production
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Assume backend is on port 8000
    const url = `${protocol}//localhost:8000/api/v1/ws/${userId}`;
    
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch (e) {
        console.error("Failed to parse websocket message", e);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [userId]);

  return ws.current;
}
