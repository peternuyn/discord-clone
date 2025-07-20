import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';

interface RemoteStreams {
  [userId: string]: MediaStream;
}

interface VoiceParticipant {
  userId: string;
  username: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

interface UseWebRTCVoiceProps {
  user: any;
  currentVoiceChannel: string | null;
}

interface UseWebRTCVoiceReturn {
  localStream: MediaStream | null;
  remoteStreams: RemoteStreams;
  isMuted: boolean;
  isDeafened: boolean;
  isConnecting: boolean;
  joinVoiceChannel: (channelId: string, participants: VoiceParticipant[]) => Promise<void>;
  leaveVoiceChannel: () => Promise<void>;
  toggleMute: () => void;
  toggleDeafen: () => void;
  setInputVolume: (volume: number) => void;
  setOutputVolume: (volume: number) => void;
}

export function useWebRTCVoice({ user, currentVoiceChannel }: UseWebRTCVoiceProps): UseWebRTCVoiceReturn {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreams>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  // Initialize local stream
  useEffect(() => {
    const initializeLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            // Set sample rate and channel count for better quality
            sampleRate: 48000,
            channelCount: 1, // Mono to reduce echo
          },
          video: false 
        });
        
        setLocalStream(stream);
        localStreamRef.current = stream;
      } catch (error) {
        console.error('WebRTC: Failed to get user media:', error);
      }
    };

    initializeLocalStream();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Load user's voice state on mount
  useEffect(() => {
    if (!socket || !user?.id) return;

    // Request current voice state from server
    socket.emit('voice:getState');
  }, [socket, user?.id]);

  // Listen for voice state updates from server and sync local state
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleVoiceStateUpdate = (data: { userId: string; socketId: string; isMuted?: boolean; isDeafened?: boolean; isSpeaking?: boolean }) => {
      // Only update local state if it's for the current user
      if (data.userId === user.id) {
        console.log('WebRTC: Received voice state update for current user:', data);
        
        if (data.isMuted !== undefined) {
          console.log('WebRTC: Setting isMuted to:', data.isMuted);
          setIsMuted(data.isMuted);
          // Also update the actual audio track if we have a local stream
          if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
              track.enabled = !data.isMuted;
            });
          }
        }
        
        if (data.isDeafened !== undefined) {
          console.log('WebRTC: Setting isDeafened to:', data.isDeafened);
          setIsDeafened(data.isDeafened);
          // Also update all remote audio elements
          Object.values(audioElementsRef.current).forEach(audio => {
            audio.muted = data.isDeafened || false;
          });
        }
      }
    };

    socket.on('voice:stateUpdate', handleVoiceStateUpdate);

    return () => {
      socket.off('voice:stateUpdate', handleVoiceStateUpdate);
    };
  }, [socket, user?.id]);

  // Create peer connection
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('voice:signal', {
          toUserId: peerId,
          fromUserId: user?.id,
          data: { candidate: event.candidate }
        });
      }
    };

    // Handle remote streams
    pc.ontrack = (event) => {
      if (event.streams && event.streams.length > 0) {
        const stream = event.streams[0];
        
        setRemoteStreams(prev => ({
          ...prev,
          [peerId]: stream
        }));

        // Create audio element for this stream
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        audio.autoplay = true;
        audio.volume = 0.7; // Reduce volume to prevent echo
        (audio as any).playsInline = true;
        audio.muted = isDeafened; // Set initial mute state
        
        // Prevent audio feedback and echo
        audio.preload = 'none';
        audio.controls = false;
        
        // Add event listeners for debugging
        audio.onloadedmetadata = () => {
        };
        
        audio.oncanplay = () => {
          audio.play().catch(e => console.error('WebRTC: Audio play failed:', e));
        };
        
        audio.onerror = (e) => {
          console.error('WebRTC: Audio error for peer:', peerId, e);
        };
        
        // Prevent audio feedback by monitoring audio levels
        audio.onvolumechange = () => {
          if (audio.volume > 0.8) {
            audio.volume = 0.7; // Cap volume to prevent echo
          }
        };
        
        audioElementsRef.current[peerId] = audio;
        document.body.appendChild(audio);
        
      } else {
        console.warn('WebRTC: No streams in track event for peer:', peerId);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        // Remove failed connection
        delete peerConnections.current[peerId];
        setRemoteStreams(prev => {
          const newStreams = { ...prev };
          delete newStreams[peerId];
          return newStreams;
        });
        
        // Remove audio element
        if (audioElementsRef.current[peerId]) {
          document.body.removeChild(audioElementsRef.current[peerId]);
          delete audioElementsRef.current[peerId];
        }
      }
    };

    return pc;
  }, [socket, user?.id, isDeafened]);

  // Handle incoming signaling messages
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleVoiceSignal = async ({ fromUserId, data }: { fromUserId: string; data: any }) => {
      
      let pc = peerConnections.current[fromUserId];
      if (!pc) {
        pc = createPeerConnection(fromUserId);
        peerConnections.current[fromUserId] = pc;
      }

      try {
        if (data.sdp) {
          if (data.sdp.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            socket.emit('voice:signal', {
              toUserId: fromUserId,
              fromUserId: user.id,
              data: { sdp: answer }
            });
          } else if (data.sdp.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          }
        }
        
        if (data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (error) {
        console.error('WebRTC: Error handling signal:', error);
      }
    };

    socket.on('voice:signal', handleVoiceSignal);

    return () => {
      socket.off('voice:signal', handleVoiceSignal);
    };
  }, [socket, user?.id, createPeerConnection]);

  // Join voice channel
  const joinVoiceChannel = useCallback(async (channelId: string, participants: VoiceParticipant[]) => {
    if (!localStreamRef.current || !socket || !user?.id) {
      console.error('WebRTC: Cannot join voice channel - missing requirements');
      console.error('WebRTC: localStreamRef.current:', !!localStreamRef.current);
      console.error('WebRTC: socket:', !!socket);
      console.error('WebRTC: user?.id:', user?.id);
      return;
    }

    setIsConnecting(true);
    
    try {
      // Connect to all other participants
      for (const participant of participants) {
        if (participant.userId === user.id) continue;

        let pc = peerConnections.current[participant.userId];
        if (!pc) {
          pc = createPeerConnection(participant.userId);
          peerConnections.current[participant.userId] = pc;
        }

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        socket.emit('voice:signal', {
          toUserId: participant.userId,
          fromUserId: user.id,
          data: { sdp: offer }
        });
      }
    } catch (error) {
      console.error('WebRTC: Error joining voice channel:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [socket, user?.id, createPeerConnection]);

  // Leave voice channel
  const leaveVoiceChannel = useCallback(async () => {
    
    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => {
      pc.close();
    });
    peerConnections.current = {};

    // Remove all remote streams
    setRemoteStreams({});

    // Remove all audio elements
    Object.values(audioElementsRef.current).forEach(audio => {
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
    });
    audioElementsRef.current = {};

    setIsConnecting(false);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    console.log('WebRTC: toggleMute called, current isMuted:', isMuted);
    if (!localStreamRef.current) {
      console.error('WebRTC: Cannot toggle mute - no local stream');
      return;
    }

    const newMutedState = !isMuted;
    console.log('WebRTC: Setting mute state to:', newMutedState);
    setIsMuted(newMutedState);
    
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !newMutedState;
    });

    // Update all peer connections
    Object.values(peerConnections.current).forEach(pc => {
      const senders = pc.getSenders();
      senders.forEach(sender => {
        if (sender.track && sender.track.kind === 'audio') {
          sender.track.enabled = !newMutedState;
        }
      });
    });

    // Always send socket event for global state update (works whether in channel or not)
    if (socket) {
      console.log('WebRTC: Emitting voice:updateState for mute:', newMutedState);
      socket.emit('voice:updateState', { isMuted: newMutedState });
    } else {
      console.error('WebRTC: Cannot emit socket event - no socket');
    }
  }, [isMuted, socket]);

  // Toggle deafen
  const toggleDeafen = useCallback(() => {
    console.log('WebRTC: toggleDeafen called, current isDeafened:', isDeafened);
    const newDeafenedState = !isDeafened;
    console.log('WebRTC: Setting deafen state to:', newDeafenedState);
    setIsDeafened(newDeafenedState);
    
    // Mute/unmute all remote audio elements
    Object.values(audioElementsRef.current).forEach(audio => {
      audio.muted = newDeafenedState;
    });

    // Always send socket event for global state update (works whether in channel or not)
    if (socket) {
      console.log('WebRTC: Emitting voice:updateState for deafen:', newDeafenedState);
      socket.emit('voice:updateState', { isDeafened: newDeafenedState });
    } else {
      console.error('WebRTC: Cannot emit socket event - no socket');
    }
  }, [isDeafened, socket]);

  // Set input volume
  const setInputVolume = useCallback((volume: number) => {
    if (!localStreamRef.current) return;
    
    localStreamRef.current.getAudioTracks().forEach(track => {
      if (track.kind === 'audio') {
        // Note: This is a simplified approach. In a real implementation,
        // you'd use a MediaStreamTrackProcessor or similar for volume control
      }
    });
  }, []);

  // Set output volume
  const setOutputVolume = useCallback((volume: number) => {
    // Cap volume to prevent echo (max 70%)
    const safeVolume = Math.min(volume / 100, 0.7);
    
    Object.values(audioElementsRef.current).forEach(audio => {
      audio.volume = safeVolume;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveVoiceChannel();
    };
  }, [leaveVoiceChannel]);

  return {
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
  };
}