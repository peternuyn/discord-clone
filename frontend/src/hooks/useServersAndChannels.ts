import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';



// --- Types ---
interface ChannelData {
  name: string;
  type: string;
  id?: string;
}



export function useServersAndChannels() {
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<any | null>(null);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelModalMode, setChannelModalMode] = useState<'create' | 'edit'>('create');
  const [editingChannel, setEditingChannel] = useState<any>(null);
  const [creatingChannelType, setCreatingChannelType] = useState<string>('text');


  

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

    /**
   * Handle channel form submission (create/edit)
   */
    const handleChannelSubmit = async (data: ChannelData) => {
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
  
    /**
     * Delete channel
     */
    const handleDeleteChannel = async (channelId: string) => {
      if (!selectedServer) return;
      await apiService.deleteChannel(channelId);
      // Socket event will handle the UI update
      if (selectedChannel?.id === channelId) {
        const remainingChannels = selectedServer.channels.filter((c: any) => c.id !== channelId);
        setSelectedChannel(remainingChannels[0] || null);
      }
    };

      /**
   * Open create text channel modal
   */
  const openCreateTextChannel = () => {
    setChannelModalMode('create');
    setCreatingChannelType('text');
    setEditingChannel(null);
    setShowChannelModal(true);
  };

  /**
   * Open create voice channel modal
   */
  const openCreateVoiceChannel = () => {
    setChannelModalMode('create');
    setCreatingChannelType('voice');
    setEditingChannel(null);
    setShowChannelModal(true);
  };

  /**
   * Open edit channel modal
   */
  const openEditChannel = (channel: any) => {
    setChannelModalMode('edit');
    setEditingChannel(channel);
    setShowChannelModal(true);
  };

  

  return {
    servers,
    setServers,
    selectedServer,
    setSelectedServer,
    selectedChannel,
    setSelectedChannel,
    handleChannelUpdate,
    handleNewChannel,
    handleChannelDelete,
    handleCreateServer,
    handleUpdateServer,
    handleDeleteServer,
    showServerSettings,
    setShowServerSettings,
    handleChannelSubmit,
    handleDeleteChannel,
    showChannelModal,
    setShowChannelModal,
    channelModalMode,
    setChannelModalMode,
    editingChannel,
    setEditingChannel,
    creatingChannelType,
    setCreatingChannelType,
    openCreateTextChannel,
    openCreateVoiceChannel,
    openEditChannel,
  };
} 