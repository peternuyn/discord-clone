'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageInput } from '@/components/chat/MessageInput';
import { MessageReactions } from '@/components/chat/MessageReactions';
import { NotificationCenter } from '@/components/chat/NotificationCenter';
import { UserProfile } from '@/components/auth/UserProfile';
import CreateServerModal from '@/components/server/CreateServerModal';
import ChannelModal from '@/components/server/ChannelModal';
import ProtectedRoute from '@/components/ProtectedRoute';
import { VoiceChannel } from '@/components/voice/VoiceChannel';
import { VoiceControls } from '@/components/voice/VoiceControls';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useSocket } from '@/hooks/useSocket';
import { apiService } from '@/services/api';
import { 
  MessageCircle, 
  Hash, 
  Volume2, 
  Settings, 
  Plus, 
  Search, 
  Smile, 
  Paperclip, 
  Mic,
  Headphones,
  Crown,
  Shield,
  Users,
  MoreHorizontal,
  Bell,
  AtSign,
  User,
  Menu,
  X,
  LogOut,
  Trash2,
  Edit
} from 'lucide-react';
import ServerSettings from '@/components/server/ServerSettings';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { io, Socket } from 'socket.io-client';
import { Skeleton } from '@/components/ui/skeleton';
import OnlineUsersSidebar from '@/components/sidebar/OnlineUsersSidebar';
import GetStartedCard from '@/components/onboarding/GetStartedCard';

interface Message {
  id: string;
  content: string;
  user: { 
    username: string; 
    avatar: string; 
    status: 'online' | 'idle' | 'dnd' | 'offline'; 
  };
  timestamp: Date;
  reactions: Array<{
    emoji: string;
    count: number;
    users: Array<{ username: string; avatar: string; }>;
  }>;
}

// Helper to enforce that no user appears in more than one channel
function enforceSingleChannelPerUser(participantsByChannel: Record<string, any[]>): Record<string, any[]> {
  const userChannelMap: Record<string, string> = {};
  const cleaned: Record<string, any[]> = {};
  Object.entries(participantsByChannel).forEach(([channelId, participants]) => {
    cleaned[channelId] = [];
    participants.forEach(p => {
      if (!userChannelMap[p.userId]) {
        userChannelMap[p.userId] = channelId;
        cleaned[channelId].push(p);
      }
      // else: user already assigned to a channel, skip
    });
  });
  return cleaned;
}

export default function Dashboard() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<any | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showServerManagement, setShowServerManagement] = useState(false);
  const [showCreateServerModal, setShowCreateServerModal] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageCache, setMessageCache] = useState<Record<string, any[]>>({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelModalMode, setChannelModalMode] = useState<'create' | 'edit'>('create');
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [creatingChannelType, setCreatingChannelType] = useState<string>('text');
  // Voice channel state management
  const [voiceChannelParticipants, setVoiceChannelParticipants] = useState<Record<string, any[]>>({});
  const [currentVoiceChannel, setCurrentVoiceChannel] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Event handler functions
  const handleNewMessage = (msg: any) => {
    const newMessage = { ...msg, timestamp: new Date(msg.createdAt) };
    setMessageCache(prev => ({
      ...prev,
      [msg.channelId]: [...(prev[msg.channelId] || []), newMessage]
    }));
    
    if (msg.channelId === selectedChannel?.id) {
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const handleReactionAdded = (data: any) => {
    setMessageCache(prev => {
      const channelMessages = prev[data.channelId] || [];
      const updatedMessages = channelMessages.map(msg => {
        if (msg.id === data.messageId) {
          const existingReaction = msg.reactions?.find((r: any) => r.emoji === data.emoji);
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions.map((r: any) =>
                r.emoji === data.emoji
                  ? { ...r, count: r.count + 1, users: [...r.users, data.user] }
                  : r
              )
            };
          } else {
            return {
              ...msg,
              reactions: [...(msg.reactions || []), {
                emoji: data.emoji,
                count: 1,
                users: [data.user]
              }]
            };
          }
        }
        return msg;
      });
      
      return {
        ...prev,
        [data.channelId]: updatedMessages
      };
    });
    
    if (data.channelId === selectedChannel?.id) {
      setMessages(prev => {
        return prev.map(msg => {
          if (msg.id === data.messageId) {
            const existingReaction = msg.reactions?.find((r: any) => r.emoji === data.emoji);
            if (existingReaction) {
              return {
                ...msg,
                reactions: msg.reactions.map((r: any) =>
                  r.emoji === data.emoji
                    ? { ...r, count: r.count + 1, users: [...r.users, data.user] }
                    : r
                )
              };
            } else {
              return {
                ...msg,
                reactions: [...(msg.reactions || []), {
                  emoji: data.emoji,
                  count: 1,
                  users: [data.user]
                }]
              };
            }
          }
          return msg;
        });
      });
    }
  };

  const handleReactionRemoved = (data: any) => {
    setMessageCache(prev => {
      const channelMessages = prev[data.channelId] || [];
      const updatedMessages = channelMessages.map(msg => {
        if (msg.id === data.messageId) {
          return {
            ...msg,
            reactions: msg.reactions?.map((r: any) =>
              r.emoji === data.emoji
                ? { ...r, count: Math.max(0, r.count - 1), users: r.users.filter((u: any) => u.id !== data.user.id) }
                : r
            ).filter((r: any) => r.count > 0) || []
          };
        }
        return msg;
      });
      
      return {
        ...prev,
        [data.channelId]: updatedMessages
      };
    });
    
    if (data.channelId === selectedChannel?.id) {
      setMessages(prev => {
        return prev.map(msg => {
          if (msg.id === data.messageId) {
            return {
              ...msg,
              reactions: msg.reactions?.map((r: any) =>
                r.emoji === data.emoji
                  ? { ...r, count: Math.max(0, r.count - 1), users: r.users.filter((u: any) => u.id !== data.user.id) }
                  : r
              ).filter((r: any) => r.count > 0) || []
            };
          }
          return msg;
        });
      });
    }
  };

  const handleChannelUpdate = (updatedChannel: any) => {
    setServers(prev => prev.map(server => ({
      ...server,
      channels: server.channels.map((channel: any) => 
        channel.id === updatedChannel.id ? updatedChannel : channel
      )
    })));
    
    if (selectedChannel?.id === updatedChannel.id) {
      setSelectedChannel(updatedChannel);
    }
  };

  const handleNewChannel = (newChannel: any) => {
    setServers(prev => prev.map(server => 
      server.id === newChannel.serverId 
        ? { ...server, channels: [...server.channels, newChannel] }
        : server
    ));
  };

  const handleChannelDelete = (channelId: string) => {
    setServers(prev => prev.map(server => ({
      ...server,
      channels: server.channels.filter((channel: any) => channel.id !== channelId)
    })));
    
    if (selectedChannel?.id === channelId) {
      const currentServer = servers.find(s => s.channels.some((c: any) => c.id === channelId));
      if (currentServer && currentServer.channels.length > 0) {
        setSelectedChannel(currentServer.channels[0]);
      }
    }
  };

  // Voice channel event handlers
  const handleVoiceJoined = (data: { channelId: string; participants: any[] }) => {
    console.log('Dashboard: Voice joined event received:', data);
    setCurrentVoiceChannel(data.channelId);
    
    // Update participants for the joined channel
    setVoiceChannelParticipants(prev => {
      const updated = {
        ...prev,
        [data.channelId]: data.participants
      };
      console.log('Dashboard: Updated voiceChannelParticipants after join:', updated);
      return updated;
    });
  };

  const handleVoiceLeft = () => {
    console.log('Dashboard: Voice left event received');
    setCurrentVoiceChannel(null);
    
    // Also remove the current user from all voice channel participants
    if (user?.id) {
      setVoiceChannelParticipants(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(channelId => {
          updated[channelId] = updated[channelId].filter(p => p.userId !== user.id);
        });
        
        // Clean up empty channels
        Object.keys(updated).forEach(channelId => {
          if (updated[channelId].length === 0) {
            delete updated[channelId];
          }
        });
        
        console.log('Dashboard: Updated voiceChannelParticipants after leave:', updated);
        return updated;
      });
    }
  };

  const handleVoiceUserJoined = (data: { channelId: string; userId: string; username: string; discriminator: string; avatar?: string; socketId: string; joinedAt: Date }) => {
    console.log('Dashboard: Voice user joined event received:', data);
    
    setVoiceChannelParticipants(prev => {
      const updated = { ...prev };
      
      // Remove user from any other voice channels first
      Object.keys(updated).forEach(channelId => {
        if (channelId !== data.channelId) {
          updated[channelId] = updated[channelId].filter(p => p.userId !== data.userId);
        }
      });
      
      // Add user to the target channel
      if (!updated[data.channelId]) {
        updated[data.channelId] = [];
      }
      
      const existingIndex = updated[data.channelId].findIndex(p => p.userId === data.userId);
      if (existingIndex === -1) {
        updated[data.channelId].push({
          userId: data.userId,
          username: data.username,
          discriminator: data.discriminator,
          avatar: data.avatar,
          socketId: data.socketId,
          joinedAt: new Date(data.joinedAt)
        });
        console.log('Dashboard: Added user', data.username, 'to channel', data.channelId);
      }
      
      console.log('Dashboard: Final voiceChannelParticipants after user joined:', updated);
      return updated;
    });
  };

  const handleVoiceUserLeft = (data: { channelId: string; userId: string; socketId: string }) => {
    console.log('Dashboard: Voice user left event received:', data);
    
    setVoiceChannelParticipants(prev => {
      const updated = { ...prev };
      const channelParticipants = updated[data.channelId] || [];
      
      const filtered = channelParticipants.filter(p => p.userId !== data.userId);
      updated[data.channelId] = filtered;
      
      // Clean up empty channels
      Object.keys(updated).forEach(channelId => {
        if (updated[channelId].length === 0) {
          delete updated[channelId];
        }
      });
      
      console.log('Dashboard: Final voiceChannelParticipants after user left:', updated);
      return updated;
    });
  };

  const handleVoiceStateUpdate = (data: { userId: string; socketId: string; isMuted?: boolean; isDeafened?: boolean; isSpeaking?: boolean }) => {
    console.log('Dashboard: Voice state update received:', data);
    
    setVoiceChannelParticipants(prev => {
      const updated = { ...prev };
      
      // Find and update the participant in any channel
      Object.keys(updated).forEach(channelId => {
        const participantIndex = updated[channelId].findIndex(p => p.userId === data.userId);
        if (participantIndex !== -1) {
          updated[channelId][participantIndex] = {
            ...updated[channelId][participantIndex],
            ...data
          };
        }
      });
      
      return updated;
    });
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedServerRef = useRef<any>(null);
  const { onlineUsers, isLoading: isLoadingOnlineUsers, error: onlineUsersError } = useOnlineUsers({ serverId: selectedServer?.id });
  const { socket } = useSocket();

  // Update the ref whenever selectedServer changes
  useEffect(() => {
    selectedServerRef.current = selectedServer;
  }, [selectedServer]);

  // Debug servers state changes
  useEffect(() => {
    if (selectedServer) {
      const currentServer = servers.find(s => s.id === selectedServer.id);
      const voiceChannels = currentServer?.channels.filter((c: any) => c.type === 'voice') || [];
      
      // Update selectedServer if it exists in the new servers state
      if (currentServer && currentServer !== selectedServer) {
        setSelectedServer(currentServer);
      }
    }
  }, [servers, selectedServer]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = (event: any) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollToBottom(!isNearBottom);
  };

  // Add scroll event listener with proper options
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const data = await apiService.getUserServers();
        setServers(data);
        if (data.length > 0) {
          setSelectedServer(data[0]);
          setSelectedChannel(data[0].channels[0]);
        }
      } catch (err) {
        // handle error, e.g. show notification
      }
    };
    fetchServers();
  }, []);

  // When selectedServer changes, update selectedChannel
  useEffect(() => {
    if (selectedServer && selectedServer.channels && selectedServer.channels.length > 0) {
      setSelectedChannel(selectedServer.channels[0]);
    }
  }, [selectedServer]);

  // Load messages when channel changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChannel?.id) return;
      
      // Check if messages are already cached
      if (messageCache[selectedChannel.id]) {
        setMessages(messageCache[selectedChannel.id]);
        return;
      }
      
      setIsLoadingMessages(true);
      try {
        const response = await apiService.getChannelMessages(selectedChannel.id);
        
        // Cache the messages
        setMessageCache(prev => ({
          ...prev,
          [selectedChannel.id]: response.messages
        }));
        setMessages(response.messages);
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedChannel, messageCache]);

  // Prefetch messages for other channels in the server
  useEffect(() => {
    if (!selectedServer?.channels) return;
    
    const prefetchMessages = async () => {
      const channelsToPrefetch = selectedServer.channels.filter(
        (channel: any) => channel.id !== selectedChannel?.id && !messageCache[channel.id]
      );
      
      // Prefetch messages for up to 3 other channels
      const channelsToLoad = channelsToPrefetch.slice(0, 3);
      
      for (const channel of channelsToLoad) {
        try {
          const response = await apiService.getChannelMessages(channel.id);
          setMessageCache(prev => ({
            ...prev,
            [channel.id]: response.messages
          }));
        } catch (error) {
          // console.error(`Error prefetching messages for channel ${channel.id}:`, error);
        }
      }
    };
    
    // Delay prefetching to prioritize current channel
    const timeoutId = setTimeout(prefetchMessages, 1000);
    return () => clearTimeout(timeoutId);
  }, [selectedServer, selectedChannel, messageCache]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      // Only auto-scroll if we're near the bottom (user is viewing recent messages)
      if (isNearBottom) {
        scrollToBottom();
      }
    }
  }, [messages.length]); // Only trigger on message count changes, not content changes

  // Socket event handling
  useEffect(() => {
    if (!socket || !socket.connected) {
      console.log('Dashboard: Socket not available or not connected');
      return;
    }

    console.log('Dashboard: Registering socket event listeners');

    // Message events
    socket.on('message:new', handleNewMessage);
    socket.on('reaction:added', handleReactionAdded);
    socket.on('reaction:removed', handleReactionRemoved);
    
    // Channel events
    socket.on('channel:update', handleChannelUpdate);
    socket.on('channel:new', handleNewChannel);
    socket.on('channel:delete', handleChannelDelete);
    
    // Voice channel events
    socket.on('voice:joined', handleVoiceJoined);
    socket.on('voice:left', handleVoiceLeft);
    socket.on('voice:userJoined', handleVoiceUserJoined);
    socket.on('voice:userLeft', handleVoiceUserLeft);
    socket.on('voice:stateUpdate', handleVoiceStateUpdate);

    // User online/offline events
    const handleUserOnline = (user: any) => {
      console.log('Dashboard: User online event received:', user);
    };

    const handleUserOffline = (user: any) => {
      console.log('Dashboard: User offline event received:', user);
    };

    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);

    console.log('Dashboard: All socket event listeners registered');

    // Cleanup on unmount
    return () => {
      console.log('Dashboard: Cleaning up socket event listeners');
      
      // Message events
      socket.off('message:new', handleNewMessage);
      socket.off('reaction:added', handleReactionAdded);
      socket.off('reaction:removed', handleReactionRemoved);
      
      // Channel events
      socket.off('channel:update', handleChannelUpdate);
      socket.off('channel:new', handleNewChannel);
      socket.off('channel:delete', handleChannelDelete);
      
      // Voice channel events
      socket.off('voice:joined', handleVoiceJoined);
      socket.off('voice:left', handleVoiceLeft);
      socket.off('voice:userJoined', handleVoiceUserJoined);
      socket.off('voice:userLeft', handleVoiceUserLeft);
      socket.off('voice:stateUpdate', handleVoiceStateUpdate);

      // User online/offline events
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
    };
  }, [socket, socket?.connected]);

  // Handle room joining/leaving when server or channel changes
  useEffect(() => {
    if (!socket || !socket.connected) {
      console.log('Dashboard: Cannot join rooms - socket not connected');
      return;
    }
    
    console.log('Dashboard: Setting up room joining for server:', selectedServer?.id);
    
    // Join the server room when server changes
    if (selectedServer?.id) {
      socket.emit('joinServer', selectedServer.id);
      console.log('Dashboard: Joined server room:', selectedServer.id);
      
      // Join all voice channel rooms in the server to receive voice events
      const voiceChannels = selectedServer.channels.filter((channel: any) => channel.type === 'voice');
      console.log('Dashboard: Joining', voiceChannels.length, 'voice channel rooms:', voiceChannels.map((c: any) => ({ id: c.id, name: c.name })));
      voiceChannels.forEach((channel: any) => {
        socket.emit('join', channel.id);
        console.log('Dashboard: Joined voice channel room:', channel.id, channel.name);
      });
    }
    
    // Join the channel room when channel changes
    if (selectedChannel?.id) {
      socket.emit('join', selectedChannel.id);
      console.log('Dashboard: Joined channel room:', selectedChannel.id);
    }
    
    // Cleanup when component unmounts or dependencies change
    return () => {
      console.log('Dashboard: Cleaning up room joining');
      if (selectedChannel?.id) {
        socket.emit('leave', selectedChannel.id);
        console.log('Dashboard: Left channel room:', selectedChannel.id);
      }
      
      // Leave all voice channel rooms when server changes
      if (selectedServer?.id) {
        const voiceChannels = selectedServer.channels.filter((channel: any) => channel.type === 'voice');
        voiceChannels.forEach((channel: any) => {
          socket.emit('leave', channel.id);
          console.log('Dashboard: Left voice channel room:', channel.id);
        });
      }
    };
  }, [selectedServer?.id, selectedChannel?.id, socket, socket?.connected]);



  const handleSendMessage = async (message: string) => {
    if (!selectedChannel?.id || !user) return;

    // Create optimistic message with a unique temp ID
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage = {
      id: tempId,
      content: message,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        status: 'online' as const,
      },
      timestamp: new Date(),
      reactions: [],
      isOptimistic: true, // Flag to identify optimistic messages
    };

    // Add to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Send to server
      const newMessage = await apiService.createMessage(selectedChannel.id, message);
      
      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...newMessage, timestamp: new Date(newMessage.createdAt) } : msg
      ));
      
      // Update cache
      setMessageCache(prev => ({
        ...prev,
        [selectedChannel.id]: (prev[selectedChannel.id] || []).map(msg => 
          msg.id === tempId ? { ...newMessage, timestamp: new Date(newMessage.createdAt) } : msg
        )
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      // You could show a toast notification here
    }
  };

  const handleTyping = (isTyping: boolean) => {
    // console.log('Typing:', isTyping);
  };

  const handleReactionAdd = async (messageId: string, emoji: string) => {
    if (!user) return;
    // Optimistically update UI
    setMessages((prev: any[]) =>
      prev.map((msg: any) => {
        if (msg.id !== messageId) return msg;
        const existing = msg.reactions.find((r: any) => r.emoji === emoji);
        if (existing) {
          // Add current user to users array if not already present
          if (!existing.users.some((u: any) => u.id === user.id)) {
            return {
              ...msg,
              reactions: msg.reactions.map((r: any) =>
                r.emoji === emoji
                  ? { ...r, count: r.count + 1, users: [...r.users, { id: user.id, username: user.username, avatar: user.avatar }] }
                  : r
              ),
            };
          }
          return msg;
        } else {
          // Add new reaction
          return {
            ...msg,
            reactions: [
              ...msg.reactions,
              {
                emoji,
                count: 1,
                users: [{ id: user.id, username: user.username, avatar: user.avatar }],
              },
            ],
          };
        }
      })
    );

    try {
      const res = await apiService.addReaction(messageId, emoji);
      // Replace with backend's version
      setMessages((prev: any[]) =>
        prev.map((msg: any) =>
          msg.id === messageId ? { ...msg, reactions: res.updatedMessage.reactions } : msg
        )
      );
    } catch (error) {
      // Rollback: remove the optimistic reaction
      setMessages((prev: any[]) =>
        prev.map((msg: any) => {
          if (msg.id !== messageId) return msg;
          return {
            ...msg,
            reactions: msg.reactions
              .map((r: any) =>
                r.emoji === emoji
                  ? { ...r, count: r.count - 1, users: r.users.filter((u: any) => u.id !== user.id) }
                  : r
              )
              .filter((r: any) => r.count > 0),
          };
        })
      );
    }
  };

  const handleReactionRemove = async (messageId: string, emoji: string) => {
    if (!user) return;
    // Optimistically update UI
    setMessages((prev: any[]) =>
      prev.map((msg: any) => {
        if (msg.id !== messageId) return msg;
        return {
          ...msg,
          reactions: msg.reactions
            .map((r: any) =>
              r.emoji === emoji
                ? { ...r, count: r.count - 1, users: r.users.filter((u: any) => u.id !== user.id) }
                : r
            )
            .filter((r: any) => r.count > 0),
        };
      })
    );

    try {
      const res = await apiService.removeReaction(messageId, emoji);
      // Replace with backend's version
      setMessages((prev: any[]) =>
        prev.map((msg: any) =>
          msg.id === messageId ? { ...msg, reactions: res.updatedMessage.reactions } : msg
        )
      );
    } catch (error) {
      // Rollback: re-add the user's reaction (best effort, or refetch from backend if needed)
      // For simplicity, you may want to refetch the message or show an error toast
    }
  };

  const handleCreateServer = async (serverData: { name: string; description: string; icon: string }) => {
    try {
      // Call backend to create server
      const newServer = await apiService.createServer(serverData);
      // Add new server to the list and select it
      setServers(prev => [...prev, newServer]);
      setSelectedServer(newServer);
      setSelectedChannel(newServer.channels[0]);
    } catch (err) {
      // handle error, e.g. show notification
    }
  };

  // Handler to update server
  const handleUpdateServer = async (data: { name: string; description: string; icon: string }) => {
    if (!selectedServer) return;
    try {
      const updated = await apiService.updateServer(selectedServer.id, data);
      setServers(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSelectedServer(updated);
    } catch (err) {
      // handle error
    }
  };
  // Handler to delete server
  const handleDeleteServer = async () => {
    if (!selectedServer) return;
    try {
      await apiService.deleteServer(selectedServer.id);
      setServers(prev => prev.filter(s => s.id !== selectedServer.id));
      setSelectedServer(servers.length > 1 ? servers.find(s => s.id !== selectedServer.id) : null);
      setShowServerSettings(false);
    } catch (err) {
      // handle error
    }
  };

  // Open create text channel modal
  const openCreateTextChannel = () => {
    setChannelModalMode('create');
    setCreatingChannelType('text');
    setEditingChannel(null);
    setShowChannelModal(true);
  };

  // Open create voice channel modal
  const openCreateVoiceChannel = () => {
    setChannelModalMode('create');
    setCreatingChannelType('voice');
    setEditingChannel(null);
    setShowChannelModal(true);
  };

  // Open edit channel modal
  const openEditChannel = (channel: any) => {
    setChannelModalMode('edit');
    setEditingChannel(channel);
    setShowChannelModal(true);
  };

  // Handle channel form submission
  const handleChannelSubmit = async (data: { name: string; type: string; id?: string }) => {
    if (!selectedServer) return;
    
    try {
      if (channelModalMode === 'create') {
        const newChannel = await apiService.createChannel(selectedServer.id, { 
          name: data.name, 
          type: data.type 
        });
        
        // Socket event will handle the UI update
        setSelectedChannel(newChannel);
      } else if (data.id) {
        const updated = await apiService.updateChannel(data.id, { 
          name: data.name, 
          type: data.type 
        });
        // Socket event will handle the UI update
        if (selectedChannel?.id === updated.id) {
          setSelectedChannel(updated);
        }
      }
    } catch (error) {
      console.error('Error handling channel:', error);
    }
  };

  // Delete channel
  const handleDeleteChannel = async (channelId: string) => {
    if (!selectedServer) return;
    await apiService.deleteChannel(channelId);
    // Socket event will handle the UI update
    if (selectedChannel?.id === channelId) {
      const remainingChannels = selectedServer.channels.filter((c: any) => c.id !== channelId);
      setSelectedChannel(remainingChannels[0] || null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'admin': return <Crown className="w-3 h-3 text-purple-500" />;
      case 'moderator': return <Shield className="w-3 h-3 text-blue-500" />;
      default: return null;
    }
  };

  // Test function to manually add a channel
  const testAddChannel = () => {
    const testChannel = {
      id: `test-${Date.now()}`,
      name: 'Test Voice Channel',
      type: 'voice',
      serverId: selectedServer?.id,
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setServers(prev => {
      const updated = prev.map(server => 
        server.id === selectedServer?.id 
          ? { ...server, channels: [...server.channels, testChannel] }
          : server
      );
      return updated;
    });
  };

  return (
    <>
      {servers.length === 0 ? (
        // Show GetStartedCard when no servers are present
        <div className="h-max bg-gray-900 flex">
          {/* Server Sidebar - Keep it minimal for onboarding */}
          <div className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-4">
            {/* Home Server */}
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            
            <Separator className="w-8 bg-gray-600" />
            
            {/* Add Server - Highlighted for onboarding */}
            <div 
              className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors shadow-lg animate-pulse"
              onClick={() => setShowCreateServerModal(true)}
            >
              <Plus className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* GetStartedCard takes the rest of the space */}
          <GetStartedCard onCreateServer={() => setShowCreateServerModal(true)} />
        </div>
      ) : (
        // Show normal dashboard when servers are present
        <div className="h-screen bg-gray-900 flex">
          {/* Server Sidebar */}
          <div className="w-16 bg-gray-800 flex flex-col items-center py-4 space-y-4">
            {/* Home Server */}
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            
            <Separator className="w-8 bg-gray-600" />
            
            {/* Server List */}
            {servers.map((server) => (
              <div
                key={server.id}
                onClick={() => setSelectedServer(server)}
                className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                  selectedServer?.id === server.id 
                    ? 'bg-purple-600 rounded-2xl' 
                    : 'bg-gray-700 hover:bg-gray-600 hover:rounded-2xl'
                }`}
              >
                <span className="text-xl">{server.icon || '🟣'}</span>
              </div>
            ))}
            
            {/* Add Server */}
            <div 
              className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={() => setShowCreateServerModal(true)}
            >
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
          </div>

        {/* Channel Sidebar */}
        <div className="w-60 bg-gray-800 flex flex-col">
          {/* Server Header */}
          <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
            <h2 className="text-white font-semibold">{selectedServer?.name || 'Select a Server'}</h2>
            <div className="flex items-center space-x-2">
              <NotificationCenter />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowServerSettings(true)}
                className="text-gray-400 hover:bg-gray-700/50 hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Channel List */}
          <div className="flex-1 p-3">
            <div className="mb-6">
              <div className="flex items-center justify-between text-gray-400 text-xs font-semibold px-3 mb-3 uppercase tracking-wider">
                <span>Text Channels</span>
                {selectedServer?.ownerId === user?.id && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={openCreateTextChannel} 
                    className="hover:text-green-400 hover:bg-green-400/10 w-6 h-6 rounded-md transition-all duration-200"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {selectedServer?.channels
                  .filter((channel: any) => channel.type === 'text')
                  .map((channel: any) => (
                    <div
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel)}
                      className={`group flex items-center space-x-2 px-3 py-2 rounded-md cursor-pointer transition-all duration-200 ${
                        selectedChannel?.id === channel.id 
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' 
                          : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        <Hash className={`w-4 h-4 ${selectedChannel?.id === channel.id ? 'text-purple-400' : 'text-gray-500'}`} />
                        <span className="text-sm font-medium truncate">{channel.name}</span>
                      </div>
                      
                      {selectedServer?.ownerId === user?.id && (
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={e => { e.stopPropagation(); openEditChannel(channel); }} 
                            className="hover:text-yellow-400 hover:bg-yellow-400/10 w-6 h-6 rounded-md transition-all duration-200"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={e => { e.stopPropagation(); handleDeleteChannel(channel.id); }} 
                            className="hover:text-red-400 hover:bg-red-400/10 w-6 h-6 rounded-md transition-all duration-200"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between text-gray-400 text-xs font-semibold px-3 mb-3 uppercase tracking-wider">
                <span>Voice Channels</span>
                {selectedServer?.ownerId === user?.id && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={openCreateVoiceChannel} 
                    className="hover:text-green-400 hover:bg-green-400/10 w-6 h-6 rounded-md transition-all duration-200"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {(() => {
                  const voiceChannels = selectedServer?.channels.filter((channel: any) => channel.type === 'voice');
                  return voiceChannels?.map((channel: any) => (
                    <VoiceChannel
                      key={channel.id}
                      channel={channel}
                      currentUser={user}
                      participants={voiceChannelParticipants[channel.id] || []}
                      currentVoiceChannel={currentVoiceChannel}
                      onJoin={(channelId) => {
                        setCurrentVoiceChannel(channelId);
                      }}
                      onLeave={() => {
                        setCurrentVoiceChannel(null);
                      }}
                    />
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="h-16 bg-gray-700 flex items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar || ''} />
                <AvatarFallback>{user?.username ? user.username[0].toUpperCase() : '?'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white text-sm font-medium">{user?.username || 'Unknown'}</p>
                <p className="text-gray-400 text-xs">#{user?.discriminator || '0000'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowUserProfile(!showUserProfile)}
                className="text-gray-400 hover:text-white"
              >
                <User className="w-4 h-4" />
              </Button>
              <VoiceControls />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Chat Header */}
        <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Hash className="w-5 h-5 text-gray-400" />
              <h3 className="text-white font-semibold">{selectedChannel?.name || 'Select a Channel'}</h3>
              <Badge variant="secondary" className="text-xs">3 online</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
              <Users className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
              <Search className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
              <MoreHorizontal className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
            </div>
          </div>

          {/* Messages and Online Users */}
          <div className="flex-1 flex overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 flex flex-col relative">
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {isLoadingMessages ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex space-x-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                    <div key={message.id || message.tempId || index} className="flex space-x-3 group hover:bg-gray-800 p-2 rounded">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={message.user?.avatar || ''} />
                        <AvatarFallback>{(message.user?.username || 'Unknown')[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{message.user?.username || 'Unknown'}</span>
                          <span className="text-gray-400 text-xs">
                            {message.createdAt
                              ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </span>
                        </div>
                        <p className="text-gray-300 mt-1">{message.content}</p>
                        <MessageReactions 
                          reactions={message.reactions || []}
                          onReactionAdd={(emoji) => handleReactionAdd(message.id, emoji)}
                          onReactionRemove={(emoji) => handleReactionRemove(message.id, emoji)}
                        />
                      </div>
                    </div>
                  ))
                  )}
                </div>
                <div ref={messagesEndRef} />
              </div>
              
              {/* Scroll to Bottom Button */}
              {showScrollToBottom && (
                <div className="absolute bottom-4 right-4 z-10">
                  <Button
                    size="sm"
                    onClick={scrollToBottom}
                    className="bg-gray-700 hover:bg-gray-600 text-white rounded-full w-10 h-10 p-0"
                  >
                    ↓
                  </Button>
                </div>
              )}
            </div>

            {/* Online Users */}
            <OnlineUsersSidebar serverId={selectedServer?.id} />
          </div>

          {/* Enhanced Message Input */}
          <div className="flex-shrink-0">
            <MessageInput 
              channelName={selectedChannel?.name || ''}
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
            />
          </div>
        </div>
      </div>
      )}

      {/* Create Server Modal */}
      <CreateServerModal
        isOpen={showCreateServerModal}
        onClose={() => setShowCreateServerModal(false)}
        onCreateServer={handleCreateServer}
      />

      <ServerSettings
        server={selectedServer}
        isOpen={showServerSettings}
        onClose={() => setShowServerSettings(false)}
        onSave={handleUpdateServer}
        onDelete={handleDeleteServer}
      />

      {/* Channel Modal */}
      <ChannelModal
        isOpen={showChannelModal}
        onClose={() => setShowChannelModal(false)}
        onSubmit={handleChannelSubmit}
        mode={channelModalMode}
        channelType={channelModalMode === 'create' ? creatingChannelType : (editingChannel?.type || 'text')}
        initialData={editingChannel ? {
          name: editingChannel.name,
          type: editingChannel.type,
          id: editingChannel.id
        } : undefined}
        serverId={selectedServer?.id}
      />
    </>
  );
} 