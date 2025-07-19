import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { useSocket } from './useSocket';

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
  const { socket } = useSocket();

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
    if (!enableRealTime || !socket) return;

    console.log('useOnlineUsers: Setting up real-time listeners for serverId:', serverId);

    // Listen for user online events
    const handleUserOnline = (user: OnlineUser) => {
      console.log('useOnlineUsers: User online event received:', user);
      
      // The backend already filters events by server membership, so we can safely add the user
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
    };

    // Listen for user offline events
    const handleUserOffline = (user: { userId: string; username: string; discriminator: string }) => {
      console.log('useOnlineUsers: User offline event received:', user);
      
      setOnlineUsers(prev => prev.filter(u => u.userId !== user.userId));
    };

    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);

    // Cleanup
    return () => {
      console.log('useOnlineUsers: Cleaning up real-time listeners');
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
    };
  }, [enableRealTime, serverId, socket]);

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