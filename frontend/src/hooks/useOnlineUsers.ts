import { useState, useEffect, useRef } from 'react';
import { apiService } from '@/services/api';
import { io, Socket } from 'socket.io-client';

interface OnlineUser {
  userId: string;
  username: string;
  discriminator: string;
  avatar?: string;
  socketId: string;
  connectedAt: Date;
}

interface UseOnlineUsersOptions {
  serverId?: string;
  enableRealTime?: boolean;
}

export function useOnlineUsers({ serverId, enableRealTime = true }: UseOnlineUsersOptions = {}) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Fetch online users from API
  const fetchOnlineUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let data;
      if (serverId) {
        data = await apiService.getOnlineUsersForServer(serverId);
      } else {
        data = await apiService.getOnlineUsers();
      }
      
      setOnlineUsers(data.onlineUsers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch online users');
      console.error('Error fetching online users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup real-time updates via websocket
  useEffect(() => {
    if (!enableRealTime) return;

    // Initialize socket connection
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        auth: {
          token: document.cookie.split('token=')[1]?.split(';')[0] // Extract token from cookie
        }
      });
    }

    const socket = socketRef.current;

    // Listen for user online events
    const handleUserOnline = (user: OnlineUser) => {
      // Only add user if we're not filtering by server, or if we need to check server membership
      if (!serverId) {
        setOnlineUsers(prev => {
          // Check if user is already in the list
          const existingUser = prev.find(u => u.userId === user.userId);
          if (existingUser) {
            // Update existing user
            return prev.map(u => u.userId === user.userId ? user : u);
          } else {
            // Add new user
            return [...prev, user];
          }
        });
      } else {
        // If we're filtering by server, we need to check if this user belongs to our server
        // Since we can't easily check this on the frontend, we'll refetch the server-specific list
        fetchOnlineUsers();
      }
    };

    // Listen for user offline events
    const handleUserOffline = (user: { userId: string; username: string; discriminator: string }) => {
      if (!serverId) {
        setOnlineUsers(prev => prev.filter(u => u.userId !== user.userId));
      } else {
        // If we're filtering by server, refetch to get the updated list
        fetchOnlineUsers();
      }
    };

    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);

    // Cleanup
    return () => {
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
    };
  }, [enableRealTime, serverId]); // Add serverId as dependency

  // Initial fetch
  useEffect(() => {
    fetchOnlineUsers();
  }, [serverId]);

  // Refresh function
  const refresh = () => {
    fetchOnlineUsers();
  };

  return {
    onlineUsers,
    isLoading,
    error,
    refresh,
    count: onlineUsers.length,
  };
} 