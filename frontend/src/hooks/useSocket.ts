import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Singleton socket instance
let globalSocket: Socket | null = null;
let connectionCount = 0;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection if not exists
    if (!globalSocket) {
      globalSocket = io('http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        forceNew: false, // Prevent duplicate connections
      });
      
      globalSocket.on('connect', () => {
        setIsConnected(true);
      });
      
      globalSocket.on('disconnect', () => {
        setIsConnected(false);
      });
      
      globalSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });
    }

    // Increment connection count
    connectionCount++;
    socketRef.current = globalSocket;

    // Set initial connection state
    if (globalSocket.connected) {
      setIsConnected(true);
    }

    return () => {
      // Decrement connection count
      connectionCount--;
      
      // Only disconnect if no components are using the socket
      if (connectionCount === 0 && globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected
  };
} 