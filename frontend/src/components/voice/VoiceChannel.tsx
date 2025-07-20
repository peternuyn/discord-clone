'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Volume2, Mic, MicOff, Headphones, HeadphoneOff, Users, Crown, Settings } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

interface VoiceParticipant {
  userId: string;
  socketId: string;
  username: string;
  discriminator: string;
  avatar?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  joinedAt: Date;
}

interface VoiceChannelProps {
  channel: {
    id: string;
    name: string;
    type: string;
    serverId: string;
  };
  isSelected?: boolean;
  currentUser?: any;
  participants?: VoiceParticipant[];
  currentVoiceChannel?: string | null;
  onJoin?: (channelId: string) => void;
  onLeave?: () => void;
}

export const VoiceChannel = React.memo(function VoiceChannel({ 
  channel, 
  isSelected = false, 
  currentUser,
  participants = [],
  currentVoiceChannel,
  onJoin,
  onLeave 
}: VoiceChannelProps) {
  const { socket, isConnected } = useSocket();
  const [isInChannel, setIsInChannel] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [channelParticipants, setChannelParticipants] = useState<VoiceParticipant[]>([]);
  
  // Use refs to store the latest callback functions
  const onJoinRef = useRef(onJoin);
  const onLeaveRef = useRef(onLeave);
  
  // Update refs when callbacks change
  useEffect(() => {
    onJoinRef.current = onJoin;
    onLeaveRef.current = onLeave;
  }, [onJoin, onLeave]);

  // Check if current user is in this voice channel and update participants
  useEffect(() => {
    if (currentUser && participants) {
      const userInChannel = participants.find(p => p.userId === currentUser.id);
      const isCurrentVoiceChannel = currentVoiceChannel === channel.id;
      const shouldBeInChannel = !!userInChannel || isCurrentVoiceChannel;
      
      const wasInChannel = isInChannel;
      setIsInChannel(shouldBeInChannel);
      
      if (userInChannel) {
        setIsMuted(userInChannel.isMuted);
        setIsDeafened(userInChannel.isDeafened);
      }
      
      // Update local participants state
      setChannelParticipants(participants);
      
      console.log(`VoiceChannel: ${channel.name} - User ${currentUser.username} in channel: ${shouldBeInChannel}, was: ${wasInChannel}, userInParticipants: ${!!userInChannel}, isCurrentVoiceChannel: ${isCurrentVoiceChannel}, participantsCount: ${participants.length}, currentVoiceChannel: ${currentVoiceChannel}`);
    }
  }, [currentUser, participants, currentVoiceChannel, channel.id, channel.name]);

  // Listen for voice join/leave responses
  useEffect(() => {
    if (!socket) return;

    const handleVoiceJoined = (data: { channelId: string; participants: VoiceParticipant[] }) => {
      if (data.channelId === channel.id) {
        setIsJoining(false);
        onJoinRef.current?.(channel.id);
      }
    };

    const handleVoiceLeft = () => {
      console.log('VoiceChannel: Received voice:left event for channel:', channel.name);
      console.log('VoiceChannel: Current user:', currentUser?.username);
      console.log('VoiceChannel: isInChannel before:', isInChannel);
      console.log('VoiceChannel: Current voice channel:', currentVoiceChannel);
      console.log('VoiceChannel: This channel ID:', channel.id);
      
      // Always handle the leave event if the user was in this channel
      if (isInChannel) {
        setIsJoining(false);
        setIsLeaving(false);
        setIsInChannel(false);
        console.log('VoiceChannel: Processed leave event for channel:', channel.name);
        onLeaveRef.current?.();
      } else {
        console.log('VoiceChannel: Ignoring voice:left event - user not in this channel');
      }
    };

    const handleVoiceError = (data: { error: string }) => {
      console.log('VoiceChannel: Received voice error:', data.error);
      setIsJoining(false);
      setIsLeaving(false);
      
      // Handle specific error cases
      if (data.error === 'Already in this voice channel') {
        // User is already in this channel, update UI state
        setIsInChannel(true);
        onJoinRef.current?.(channel.id);
      } else {
        // Show other errors to user
        alert(`Voice Error: ${data.error}`);
      }
    };

    socket.on('voice:joined', handleVoiceJoined);
    socket.on('voice:left', handleVoiceLeft);
    socket.on('voice:error', handleVoiceError);

    return () => {
      socket.off('voice:joined', handleVoiceJoined);
      socket.off('voice:left', handleVoiceLeft);
      socket.off('voice:error', handleVoiceError);
    };
  }, [socket, channel.id, channel.name, currentUser?.username, isInChannel, currentVoiceChannel]);

  const handleJoinVoice = () => {
    if (!socket || isJoining || isInChannel) {
      console.log('VoiceChannel: Cannot join - socket:', !!socket, 'isJoining:', isJoining, 'isInChannel:', isInChannel);
      return;
    }
    
    console.log('VoiceChannel: Sending join and voice:join request for channel:', channel.name);
    setIsJoining(true);
    socket.emit('join', channel.id);
    socket.emit('voice:join', channel.id);
  };

  const handleToggleMute = () => {
    if (!socket) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    socket.emit('voice:updateState', { isMuted: newMutedState });
  };

  const handleToggleDeafen = () => {
    if (!socket) return;
    
    const newDeafenedState = !isDeafened;
    setIsDeafened(newDeafenedState);
    socket.emit('voice:updateState', { isDeafened: newDeafenedState });
  };

  const getSpeakingCount = () => {
    return channelParticipants.filter(p => p.isSpeaking).length;
  };

  const handleLeaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`VoiceChannel: Leave button clicked in user banner for channel: ${channel.name}`);
    console.log(`VoiceChannel: Current state - isInChannel: ${isInChannel}, isLeaving: ${isLeaving}, currentUser: ${currentUser?.username}`);
    console.log(`VoiceChannel: Participants in this channel:`, participants);
    console.log(`VoiceChannel: Current voice channel: ${currentVoiceChannel}`);
    
    if (!isInChannel || isLeaving) {
      console.log(`VoiceChannel: Cannot leave - isInChannel: ${isInChannel}, isLeaving: ${isLeaving}`);
      return;
    }
    
    // Prevent multiple rapid clicks
    setIsLeaving(true);
    console.log(`VoiceChannel: Sending leave and voice:leave request for channel: ${channel.name}`);
    socket?.emit('leave', channel.id);
    socket?.emit('voice:leave');
    
    // Add a timeout to reset isLeaving if no response is received
    setTimeout(() => {
      console.log(`VoiceChannel: Timeout reached, resetting isLeaving for channel: ${channel.name}`);
      setIsLeaving(false);
    }, 5000); // 5 second timeout
  };

  return (
    <TooltipProvider>
      <div className="space-y-1">
        {/* Voice Channel */}
        <div 
          className={`
            group flex items-center space-x-2 px-3 py-2 rounded-md cursor-pointer transition-all duration-200
            ${isSelected || isInChannel 
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' 
              : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
            }
          `}
          onClick={!isInChannel ? handleJoinVoice : undefined}
        >
          <div className="flex items-center space-x-2 flex-1">
            <Volume2 className={`w-4 h-4 ${isInChannel ? 'text-purple-400' : 'text-gray-500'}`} />
            <span className="text-sm font-medium truncate">{channel.name}</span>
            {!isConnected && (
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" title="Socket disconnected"></div>
            )}
            

            
            {/* Speaking indicator */}
            {getSpeakingCount() > 0 && (
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">{getSpeakingCount()}</span>
              </div>
            )}
          </div>

          {/* Join/Leave button */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isInChannel ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      console.log('VoiceChannel: Leave button clicked in channel list');
                      e.stopPropagation();
                      handleLeaveClick(e);
                    }}
                    disabled={isLeaving}
                    className="hover:text-red-400 hover:bg-red-400/10 w-6 h-6 rounded-md transition-all duration-200 disabled:opacity-50"
                  >
                    <HeadphoneOff className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Leave voice channel</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinVoice();
                    }}
                    disabled={isJoining || !isConnected}
                    className="hover:text-green-400 hover:bg-green-400/10 w-6 h-6 rounded-md transition-all duration-200 disabled:opacity-50"
                  >
                    <Headphones className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {!isConnected ? 'Socket disconnected' : 
                     isJoining ? 'Joining...' : 'Join voice channel'}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* User Banner (Discord-like) - Shows when user is in channel */}
        {isInChannel && currentUser && (
          <div className="ml-6 bg-gray-800 rounded-md p-3 border border-gray-700">
            {/* User Info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback className="text-sm">
                      {currentUser.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800"></div>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{currentUser.username}</p>
                  <p className="text-gray-400 text-xs">#{currentUser.discriminator}</p>
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-gray-400">Connected</span>
              </div>
            </div>

            {/* Voice Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {/* Mute Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleToggleMute}
                      className={`w-8 h-8 rounded-md transition-all duration-200 ${
                        isMuted 
                          ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isMuted ? 'Unmute' : 'Mute'}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Deafen Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleToggleDeafen}
                      className={`w-8 h-8 rounded-md transition-all duration-200 ${
                        isDeafened 
                          ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      {isDeafened ? <HeadphoneOff className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isDeafened ? 'Undeafen' : 'Deafen'}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Settings Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Voice Settings</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Leave Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleLeaveClick}
                disabled={isLeaving}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all duration-200 disabled:opacity-50"
              >
                {isLeaving ? 'Leaving...' : 'Leave'}
              </Button>
            </div>
          </div>
        )}

        {/* Participants List - Shows when not in channel */}
        {!isInChannel && channelParticipants.length > 0 && (
          <div className="ml-6 space-y-1">
            <p className="text-xs text-gray-400 font-medium px-2 py-1">Currently in channel</p>
            {channelParticipants.map((participant) => (
              <div key={participant.socketId} className="flex items-center space-x-2 px-2 py-1 rounded text-xs">
                <div className="relative">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={participant.avatar} />
                    <AvatarFallback className="text-xs">
                      {participant.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {participant.isSpeaking && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
                <span className="text-gray-300 truncate">{participant.username}</span>
                <div className="flex items-center space-x-1">
                  {participant.isMuted && (
                    <MicOff className="w-3 h-3 text-red-400" />
                  )}
                  {participant.isDeafened && (
                    <HeadphoneOff className="w-3 h-3 text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Other Participants List - Shows when in channel */}
        {isInChannel && channelParticipants.length > 1 && (
          <div className="ml-6 space-y-1">
            <p className="text-xs text-gray-400 font-medium px-2 py-1">Other Participants</p>
            {channelParticipants
              .filter(p => p.userId !== currentUser?.id)
              .map((participant) => (
                <div key={participant.socketId} className="flex items-center space-x-2 px-2 py-1 rounded text-xs">
                  <div className="relative">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback className="text-xs">
                        {participant.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {participant.isSpeaking && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-gray-300 truncate">{participant.username}</span>
                  <div className="flex items-center space-x-1">
                    {participant.isMuted && (
                      <MicOff className="w-3 h-3 text-red-400" />
                    )}
                    {participant.isDeafened && (
                      <HeadphoneOff className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}); 