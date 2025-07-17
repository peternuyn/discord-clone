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
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
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
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedServerRef = useRef<any>(null);
  const { onlineUsers, isLoading: isLoadingOnlineUsers, error: onlineUsersError } = useOnlineUsers({ serverId: selectedServer?.id });

  // Update the ref whenever selectedServer changes
  useEffect(() => {
    selectedServerRef.current = selectedServer;
  }, [selectedServer]);

  // Debug servers state changes
  useEffect(() => {
    console.log('=== SERVERS STATE CHANGED ===');
    console.log('New servers state:', servers);
    if (selectedServer) {
      const currentServer = servers.find(s => s.id === selectedServer.id);
      console.log('Current server channels:', currentServer?.channels);
      const voiceChannels = currentServer?.channels.filter((c: any) => c.type === 'voice') || [];
      console.log('Voice channels in current server:', voiceChannels);
      
      // Update selectedServer if it exists in the new servers state
      if (currentServer && currentServer !== selectedServer) {
        console.log('Updating selectedServer with new data');
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
        console.log('Loading messages from cache for channel:', selectedChannel.id);
        setMessages(messageCache[selectedChannel.id]);
        return;
      }
      
      setIsLoadingMessages(true);
      try {
        console.log('Loading messages from API for channel:', selectedChannel.id);
        const response = await apiService.getChannelMessages(selectedChannel.id);
        console.log('Loaded messages:', response.messages);
        
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
          console.error(`Error prefetching messages for channel ${channel.id}:`, error);
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

  // Setup socket connection and listeners
  useEffect(() => {
    // Initialize socket connection if not exists
    if (!socketRef.current) {
      socketRef.current = io('http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });
      
      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current?.id);
      });
      
      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      
      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
    
    const socket = socketRef.current;
    
    // Listen for new messages
    const handleNewMessage = (msg: any) => {
      console.log('Received new message:', msg);
      if (msg.channelId === selectedChannel?.id) {
        const newMessage = { ...msg, timestamp: new Date(msg.createdAt) };
        setMessages(prev => [...prev, newMessage]);
        
        // Update cache
        setMessageCache(prev => ({
          ...prev,
          [msg.channelId]: [...(prev[msg.channelId] || []), newMessage]
        }));
      }
    };
    
    // Listen for reaction updates
    const handleReactionAdded = (data: any) => {
      console.log('Reaction added:', data);
      if (data.messageId) {
        setMessages(prev => prev.map(msg =>
          msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
        ));
        
        // Update cache
        setMessageCache(prev => ({
          ...prev,
          [selectedChannel?.id]: (prev[selectedChannel?.id] || []).map(msg =>
            msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
          )
        }));
      }
    };
    
    const handleReactionRemoved = (data: any) => {
      console.log('Reaction removed:', data);
      if (data.messageId) {
        setMessages(prev => prev.map(msg =>
          msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
        ));
        
        // Update cache
        setMessageCache(prev => ({
          ...prev,
          [selectedChannel?.id]: (prev[selectedChannel?.id] || []).map(msg =>
            msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
          )
        }));
      }
    };
    
    // Listen for channel updates
    const handleChannelUpdate = (updatedChannel: any) => {
      console.log('Channel updated:', updatedChannel);
      setServers(prev => prev.map(server => ({
        ...server,
        channels: server.channels.map((channel: any) => 
          channel.id === updatedChannel.id ? updatedChannel : channel
        )
      })));
      
      // Update selected channel if it's the one that was updated
      if (selectedChannel?.id === updatedChannel.id) {
        setSelectedChannel(updatedChannel);
      }
    };
    
    // Listen for new channels
    const handleNewChannel = (newChannel: any) => {
      console.log('=== CHANNEL SOCKET EVENT RECEIVED ===');
      console.log('New channel created via socket:', newChannel);
      console.log('Channel type:', newChannel.type);
      console.log('Current server ID:', selectedServerRef.current?.id);
      console.log('Channel server ID:', newChannel.serverId);
      console.log('Current servers state:', servers);
      
      // Only update if the channel belongs to the current server
      if (newChannel.serverId === selectedServerRef.current?.id) {
        console.log('✅ Channel belongs to current server, updating state...');
        setServers(prev => {
          console.log('Previous servers state:', prev);
          const updated = prev.map(server => {
            if (server.id === selectedServerRef.current?.id) {
              console.log('Updating server:', server.id);
              console.log('Current channels:', server.channels);
              console.log('Adding new channel:', newChannel);
              const newChannels = [...server.channels, newChannel];
              console.log('New channels array:', newChannels);
              return {
                ...server,
                channels: newChannels
              };
            }
            return server;
          });
          console.log('Final updated servers state:', updated);
          return updated;
        });
        console.log('✅ State update triggered');
      } else {
        console.log('❌ Channel belongs to different server, not updating');
        console.log('Expected server ID:', selectedServerRef.current?.id);
        console.log('Channel server ID:', newChannel.serverId);
      }
    };

    // Test socket event listener
    const handleTestEvent = (data: any) => {
      console.log('=== TEST SOCKET EVENT RECEIVED ===');
      console.log('Test event data:', data);
    };
    
    // Listen for channel deletion
    const handleChannelDelete = (channelId: string) => {
      console.log('Channel deleted:', channelId);
      setServers(prev => prev.map(server => ({
        ...server,
        channels: server.channels.filter((channel: any) => channel.id !== channelId)
      })));
      
      // If the deleted channel was selected, select the first available channel
      if (selectedChannel?.id === channelId) {
        const currentServer = servers.find(s => s.channels.some((c: any) => c.id === channelId));
        if (currentServer && currentServer.channels.length > 0) {
          setSelectedChannel(currentServer.channels[0]);
        }
      }
    };
    
    socket.on('message:new', handleNewMessage);
    socket.on('reaction:added', handleReactionAdded);
    socket.on('reaction:removed', handleReactionRemoved);
    socket.on('channel:update', handleChannelUpdate);
    socket.on('channel:new', handleNewChannel);
    socket.on('channel:delete', handleChannelDelete);
    socket.on('test:event', handleTestEvent); // Add the new listener
    
    // Cleanup on unmount
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('reaction:added', handleReactionAdded);
      socket.off('reaction:removed', handleReactionRemoved);
      socket.off('channel:update', handleChannelUpdate);
      socket.off('channel:new', handleNewChannel);
      socket.off('channel:delete', handleChannelDelete);
      socket.off('test:event', handleTestEvent); // Remove the new listener
    };
  }, []); // Only run once on mount

  // Handle room joining/leaving when server or channel changes
  useEffect(() => {
    if (!socketRef.current) return;
    
    const socket = socketRef.current;
    
    // Join the server room when server changes
    if (selectedServer?.id) {
      console.log('Attempting to join server room:', selectedServer.id);
      socket.emit('joinServer', selectedServer.id);
      console.log('Joined server room:', selectedServer.id);
    }
    
    // Join the channel room when channel changes
    if (selectedChannel?.id) {
      console.log('Attempting to join channel room:', selectedChannel.id);
      socket.emit('join', selectedChannel.id);
      console.log('Joined channel room:', selectedChannel.id);
    }
    
    // Cleanup when component unmounts or dependencies change
    return () => {
      if (selectedChannel?.id) {
        socket.emit('leave', selectedChannel.id);
        console.log('Left channel room:', selectedChannel.id);
      }
    };
  }, [selectedServer?.id, selectedChannel?.id]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('Socket disconnected on unmount');
      }
    };
  }, []);

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
    console.log('Typing:', isTyping);
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
        
        console.log('Channel created successfully:', newChannel);
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
    console.log('=== TESTING MANUAL CHANNEL ADD ===');
    const testChannel = {
      id: `test-${Date.now()}`,
      name: 'Test Voice Channel',
      type: 'voice',
      serverId: selectedServer?.id,
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Adding test channel:', testChannel);
    setServers(prev => {
      const updated = prev.map(server => 
        server.id === selectedServer?.id 
          ? { ...server, channels: [...server.channels, testChannel] }
          : server
      );
      console.log('Updated servers with test channel:', updated);
      return updated;
    });
  };

  return (
    <ProtectedRoute>
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
              <div className="flex items-center space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={testAddChannel}
                  className="text-xs"
                >
                  Test
                </Button>
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
            </div>
            <div className="space-y-1">
              {(() => {
                const voiceChannels = selectedServer?.channels.filter((channel: any) => channel.type === 'voice');
                console.log('Voice channels:', voiceChannels);
                console.log('All channels:', selectedServer?.channels);
                return voiceChannels?.map((channel: any) => (
                  <div
                    key={channel.id}
                    className="group flex items-center space-x-2 px-3 py-2 rounded-md cursor-pointer text-gray-400 hover:bg-gray-700/50 hover:text-gray-200 transition-all duration-200"
                  >
                    <Volume2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium truncate">{channel.name}</span>
                  </div>
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
            <Mic className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
            <Headphones className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
            <Settings className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
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
    </div>
    </ProtectedRoute>
  );
} 