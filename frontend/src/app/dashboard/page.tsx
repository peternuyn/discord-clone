'use client';

// --- React/Next Imports ---
import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// --- UI Components ---
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageInput } from '@/components/chat/MessageInput';
import { MessageReactions } from '@/components/chat/MessageReactions';
import { NotificationCenter } from '@/components/chat/NotificationCenter';
import CreateServerModal from '@/components/server/CreateServerModal';
import ChannelModal from '@/components/server/ChannelModal';
import { VoiceChannel } from '@/components/voice/VoiceChannel';
import ServerSettings from '@/components/server/ServerSettings';
import OnlineUsersSidebar from '@/components/sidebar/OnlineUsersSidebar';
import GetStartedCard from '@/components/onboarding/GetStartedCard';
import { Skeleton } from '@/components/ui/skeleton';
// --- Icons ---
import {
  MessageCircle, Hash, Volume2, Settings, Plus, Search, Smile, Paperclip, Mic, MicOff,
  Headphones, Crown, Shield, Users, MoreHorizontal, Bell, AtSign, User, Menu, X,
  LogOut, Trash2, Edit
} from 'lucide-react';

// --- Custom Hooks and Services ---
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { apiService } from '@/services/api';
import { useChatReactions } from '@/hooks/useChats';
import { useServersAndChannels } from '@/hooks/useServersAndChannels';
import { useVoiceParticipants } from '@/hooks/useVoiceParticipants';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useWebRTCVoice } from '@/hooks/useWebRTCVoice';


/**
 * Main Dashboard page for the Discord clone.
 * Handles server/channel selection, chat, voice, and user state.
 * 
 * Features:
 * - Server and channel management
 * - Real-time messaging with reactions
 * - Voice channel participation
 * - Socket-based real-time updates
 * - Message caching and prefetching
 * - Responsive design with mobile support
 */
export default function Dashboard() {
  // --- Auth and Routing ---
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // --- UI State ---
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showCreateServerModal, setShowCreateServerModal] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);


  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedServerRef = useRef<any>(null);

  // --- Domain State (via custom hooks), logic is in hooks/useServersAndChannels.ts ---
  // Servers and channels management
  const {
    servers, setServers, selectedServer, setSelectedServer, selectedChannel, setSelectedChannel,
    handleChannelUpdate, handleNewChannel, handleChannelDelete,
    handleCreateServer, handleUpdateServer, handleDeleteServer,
    showServerSettings, setShowServerSettings,
    showChannelModal, setShowChannelModal,
    channelModalMode, setChannelModalMode,
    editingChannel, setEditingChannel,
    creatingChannelType, setCreatingChannelType,
    handleChannelSubmit, handleDeleteChannel,
    openCreateTextChannel, openCreateVoiceChannel, openEditChannel,
  } = useServersAndChannels();

  // Chat messages and reactions
  const {
    messageCache, messages, setMessages, setMessageCache,
    handleNewMessage, handleReactionAdded, handleReactionRemoved,
    handleReactionAdd, handleReactionRemove, handleSendMessage, handleTyping
  } = useChatReactions(selectedChannel, setSelectedChannel, user);

  // Voice channel participants and state
  const {
    currentVoiceChannel, setCurrentVoiceChannel,
    handleVoiceJoined, handleVoiceLeft, handleVoiceUserJoined, handleVoiceUserLeft, handleVoiceStateUpdate,
    memoizedVoiceParticipants,
  } = useVoiceParticipants(user, selectedServer);

  // Online users
  const {
    handleUserOnline,
    handleUserOffline,
  } = useOnlineUsers({ serverId: selectedServer?.id });

  // WebRTC Voice Chat
  const {
    localStream,
    remoteStreams,
    isMuted,
    isDeafened,
    isConnecting,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    toggleDeafen,
    setInputVolume,
    setOutputVolume,
  } = useWebRTCVoice({ user, currentVoiceChannel });

  // --- Socket Connection ---
  const { socket } = useSocket();

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Keep selectedServer ref in sync with state
   */
  useEffect(() => {
    selectedServerRef.current = selectedServer;
  }, [selectedServer]);

  /**
   * Debug and sync server state changes
   */
  useEffect(() => {
    if (selectedServer) {
      const currentServer = servers.find(s => s.id === selectedServer.id);
      
      // Update selectedServer if it exists in the new servers state
      if (currentServer && currentServer !== selectedServer) {
        setSelectedServer(currentServer);
      }
    }
  }, [servers, selectedServer]);

  /**
   * Initialize servers on component mount
   */
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
        console.error('Error fetching servers:', err);
      }
    };
    fetchServers();
  }, []);

  /**
   * Update selected channel when server changes
   */
  useEffect(() => {
    if (selectedServer?.channels?.length > 0) {
      setSelectedChannel(selectedServer.channels[0]);
    }
  }, [selectedServer]);

  /**
   * Load messages when channel changes
   */
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

  /**
   * Prefetch messages for other channels in the server
   */
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
          // Silently fail for prefetching
        }
      }
    };
    
    // Delay prefetching to prioritize current channel
    const timeoutId = setTimeout(prefetchMessages, 1000);
    return () => clearTimeout(timeoutId);
  }, [selectedServer, selectedChannel, messageCache]);

  /**
   * Auto-scroll to bottom when new messages are added
   */
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
  }, [messages.length]);

  /**
   * Setup scroll event listener
   */
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  /**
   * Register socket event listeners
   */
  useEffect(() => {
    if (!socket?.connected) {
      console.log('Dashboard: Socket not available or not connected');
      return;
    }

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

   

    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);

    // Cleanup on unmount
    return () => {
      
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

  /**
   * Handle room joining/leaving when server or channel changes
   */
  useEffect(() => {
    if (!socket?.connected) {
      console.log('Dashboard: Cannot join rooms - socket not connected');
      return;
    }
  
    
    // Join the server room when server changes
    if (selectedServer?.id) {
      socket.emit('joinServer', selectedServer.id);
    }
    
    // Join the channel room when channel changes
    if (selectedChannel?.id) {
      socket.emit('join', selectedChannel.id);
    }
    
    // Cleanup when component unmounts or dependencies change
    return () => {
      if (selectedChannel?.id) {
        socket.emit('leave', selectedChannel.id);
      }
    };
  }, [selectedServer?.id, selectedChannel?.id, socket, socket?.connected]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Handle scroll events to show/hide scroll to bottom button
   */
  const handleScroll = (event: any) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollToBottom(!isNearBottom);
  };



  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {servers.length === 0 ? (
        // --- Onboarding State ---
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
        // --- Main Dashboard ---
        <div className="h-screen bg-gray-900 flex">
          {/* --- Server Sidebar --- */}
          <div className="w-16 lg:w-20 bg-gray-800 flex flex-col items-center py-4 space-y-4 flex-shrink-0 border-r border-gray-700">
            {/* Home Server */}
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors">
              <MessageCircle className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            
            <Separator className="w-8 bg-gray-600" />
            
            {/* Server List */}
            {servers.map((server) => (
              <div
                key={server.id}
                onClick={() => setSelectedServer(server)}
                className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                  selectedServer?.id === server.id 
                    ? 'bg-purple-600 rounded-2xl' 
                    : 'bg-gray-700 hover:bg-gray-600 hover:rounded-2xl'
                }`}
              >
                <span className="text-xl lg:text-2xl">{server.icon || '🟣'}</span>
              </div>
            ))}
            
            {/* Add Server */}
            <div 
              className="w-12 h-12 lg:w-14 lg:h-14 bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={() => setShowCreateServerModal(true)}
            >
              <Plus className="w-6 h-6 lg:w-7 lg:h-7 text-gray-400" />
            </div>
          </div>

          {/* --- User Info Sidebar (Left) --- */}
          <div className="w-1/8 bg-gray-800 flex flex-col h-full">
           
        

          {/* --- Channel Sidebar --- */}
        
          {/* Server Header */}
          <div className="h-12 w-max lg:h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-3 border-r border-gray-700">
              <h2 className="text-white font-semibold text-sm lg:text-base truncate">
                {selectedServer?.name || 'Select a Server'}
              </h2>
            <div className="flex items-center space-x-2">
              <NotificationCenter />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowServerSettings(true)}
                className="text-gray-400 hover:bg-gray-700/50 hover:text-white"
              >
                <Settings className="w-4 h-4 lg:w-5 lg:h-5" />
              </Button>
            </div>
          </div>

            {/* Channel List */}
            <div className="flex-1 p-3 lg:p-4">
              {/* Text Channels */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-gray-400 text-xs lg:text-sm font-semibold px-3 mb-3 uppercase tracking-wider">
                  <span>Text Channels</span>
                  {selectedServer?.ownerId === user?.id && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={openCreateTextChannel} 
                      className="hover:text-green-400 hover:bg-green-400/10 w-6 h-6 lg:w-7 lg:h-7 rounded-md transition-all duration-200"
                    >
                      <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
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
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Hash className={`w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 ${selectedChannel?.id === channel.id ? 'text-purple-400' : 'text-gray-500'}`} />
                          <span className="text-sm lg:text-base font-medium truncate">{channel.name}</span>
                        </div>
                        
                        {selectedServer?.ownerId === user?.id && (
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={e => { e.stopPropagation(); openEditChannel(channel); }} 
                              className="hover:text-yellow-400 hover:bg-yellow-400/10 w-6 h-6 lg:w-7 lg:h-7 rounded-md transition-all duration-200"
                            >
                              <Edit className="w-3 h-3 lg:w-4 lg:h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={e => { e.stopPropagation(); handleDeleteChannel(channel.id); }} 
                              className="hover:text-red-400 hover:bg-red-400/10 w-6 h-6 lg:w-7 lg:h-7 rounded-md transition-all duration-200"
                            >
                              <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Voice Channels */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-gray-400 text-xs lg:text-sm font-semibold px-3 mb-3 uppercase tracking-wider">
                  <span>Voice Channels</span>
                  {selectedServer?.ownerId === user?.id && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={openCreateVoiceChannel} 
                      className="hover:text-green-400 hover:bg-green-400/10 w-6 h-6 lg:w-7 lg:h-7 rounded-md transition-all duration-200"
                    >
                      <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {selectedServer?.channels
                    .filter((channel: any) => channel.type === 'voice')
                    .map((channel: any) => (
                      <VoiceChannel
                        key={channel.id}
                        channel={channel}
                        currentUser={user}
                        participants={memoizedVoiceParticipants[channel.id]}
                        currentVoiceChannel={currentVoiceChannel}
                        onJoin={async (channelId) => {
                          setCurrentVoiceChannel(channelId);
                          // Join WebRTC voice channel with current participants
                          const participants = memoizedVoiceParticipants[channelId] || [];
                          await joinVoiceChannel(channelId, participants);
                        }}
                        onLeave={async () => {
                          setCurrentVoiceChannel(null);
                          // Leave WebRTC voice channel
                          await leaveVoiceChannel();
                        }}
                      />
                    ))}
                </div>
              </div>
            </div>
             

            {/* User Info Header */}
            <div className="border-b border-gray-700">
               <div className="lg:h-18 bg-gray-700 flex items-center border-b border-gray-700 w-full px-4">
                <div className="flex items-center space-x-3 min-w-0 px-1">
                  <Avatar className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0">
                    <AvatarImage src={user?.avatar || ''} />
                    <AvatarFallback>{user?.username ? user.username[0].toUpperCase() : '?'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-white text-sm lg:text-base font-medium truncate">{user?.username || 'Unknown'}</p>
                    <p className="text-gray-400 text-xs lg:text-sm">#{user?.discriminator || '0000'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Actions */}
            <div className="space-y-2 p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowUserProfile(!showUserProfile)}
                className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <User className="w-4 h-4 mr-2" />
                User Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                title="Log out"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>
          </div>

          {/* --- Main Chat Area --- */}
          <div className="flex-1 flex flex-col bg-gray-900 min-w-0">
            {/* Chat Header */}
            <div className="h-12 lg:h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
              <div className="flex items-center space-x-2 min-w-0">
                <Hash className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400 flex-shrink-0" />
                <h3 className="text-white font-semibold text-sm lg:text-base truncate">
                  {selectedChannel?.name || 'Select a Channel'}
                </h3>
                <Badge variant="secondary" className="text-xs lg:text-sm flex-shrink-0">3 online</Badge>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 cursor-pointer hover:text-white" />
                <Users className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 cursor-pointer hover:text-white" />
                <Search className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 cursor-pointer hover:text-white" />
                <MoreHorizontal className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 cursor-pointer hover:text-white" />
              </div>
            </div>

            {/* Messages and Online Users */}
            <div className="flex-1 flex overflow-hidden">
              {/* Messages Area */}
              <div className="flex-1 flex flex-col relative min-w-0">
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 lg:p-6">
                  <div className="space-y-4">
                    {isLoadingMessages ? (
                      // Loading skeleton
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
                      // Empty state
                      <div className="text-center text-gray-400 py-8">
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      // Messages list
                      messages.map((message, index) => (
                        <div key={message.id || message.tempId || index} className="flex space-x-3 group hover:bg-gray-800 p-2 lg:p-3 rounded">
                          <Avatar className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0">
                            <AvatarImage src={message.user?.avatar || ''} />
                            <AvatarFallback>{(message.user?.username || 'Unknown')[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-medium text-sm lg:text-base truncate">
                                {message.user?.username || 'Unknown'}
                              </span>
                              <span className="text-gray-400 text-xs lg:text-sm flex-shrink-0">
                                {message.createdAt
                                  ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : ''}
                              </span>
                            </div>
                            <p className="text-gray-300 mt-1 text-sm lg:text-base break-words">{message.content}</p>
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

              {/* Online Users Sidebar */}
              <div className="w-1/8 lg:w-72 flex-shrink-0">
                <OnlineUsersSidebar serverId={selectedServer?.id} />
              </div>
            </div>

            {/* Message Input */}
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

      {/* WebRTC Audio Elements - Hidden but functional */}
      <div style={{ display: 'none' }}>
        {Object.entries(remoteStreams).map(([userId, stream]) => (
          <audio
            key={userId}
            ref={(audio) => {
              if (audio && stream) {
                audio.srcObject = stream;
                audio.autoplay = true;
                audio.volume = 0.7; // Reduced volume to prevent echo
                audio.muted = isDeafened;
                audio.preload = 'none'; // Prevent preloading to reduce echo
                audio.controls = false;
                
                // Ensure audio plays
                audio.oncanplay = () => {
                  audio.play().catch(e => console.error('Dashboard: Audio play failed for user:', userId, e));
                };
              }
            }}
            autoPlay
            playsInline
          />
        ))}
      </div>

      {/* --- Modals --- */}
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