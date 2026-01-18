import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { createWebSocket } from '../lib/api';

interface WebSocketContextValue {
  ws: WebSocket | null;
  isConnected: boolean;
  error: string | null;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ws = createWebSocket('/chat');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      setError(null);
    };

    ws.onerror = (err) => {
      console.error('[WebSocket] Error:', err);
      setError('WebSocket connection error');
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);
    };

    return () => {
      console.log('[WebSocket] Cleanup - closing connection');
      ws.close();
    };
  }, []); // Single connection for app lifetime

  return (
    <WebSocketContext.Provider value={{ ws: wsRef.current, isConnected, error }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}
