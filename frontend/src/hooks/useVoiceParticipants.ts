import { useState, useCallback, useMemo } from 'react';

export function useVoiceParticipants(user: any, selectedServer: any) {
  const [voiceChannelParticipants, setVoiceChannelParticipants] = useState<Record<string, any[]>>({});
  const [currentVoiceChannel, setCurrentVoiceChannel] = useState<string | null>(null);

  
  const memoizedVoiceParticipants = useMemo(() => {
    const result: Record<string, any[]> = {};
    if (selectedServer?.channels) {
      selectedServer.channels.forEach((channel: any) => {
        if (channel.type === 'voice') {
          result[channel.id] = voiceChannelParticipants[channel.id] || [];
        }
      });
    }
    return result;
  }, [selectedServer?.channels, voiceChannelParticipants]);
  
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
      const prevParticipants = prev[data.channelId] || [];
      // Remove user from any other voice channels first
      let changed = false;
      const updated = { ...prev };
      Object.keys(updated).forEach(channelId => {
        if (channelId !== data.channelId) {
          const filtered = updated[channelId].filter(p => p.userId !== data.userId);
          if (filtered.length !== updated[channelId].length) {
            updated[channelId] = filtered;
            changed = true;
          }
        }
      });
      // Add user to the target channel if not already present
      if (!prevParticipants.find(p => p.userId === data.userId)) {
        updated[data.channelId] = [...prevParticipants, {
          userId: data.userId,
          username: data.username,
          discriminator: data.discriminator,
          avatar: data.avatar,
          socketId: data.socketId,
          joinedAt: new Date(data.joinedAt)
        }];
        changed = true;
      }
      return changed ? updated : prev;
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

  return {
    voiceChannelParticipants,
    setVoiceChannelParticipants,
    currentVoiceChannel,
    setCurrentVoiceChannel,
    handleVoiceUserJoined,
    handleVoiceUserLeft,
    handleVoiceStateUpdate,
    handleVoiceJoined,
    handleVoiceLeft,
    memoizedVoiceParticipants,
  };
} 