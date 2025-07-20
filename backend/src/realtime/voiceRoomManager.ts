import { Socket } from 'socket.io';
import { prisma } from '../lib/db';
import { getIO } from './socketServer';

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

interface VoiceRoom {
  channelId: string;
  serverId: string;
  participants: Map<string, VoiceParticipant>; // socketId -> participant
  maxParticipants?: number;
}

class VoiceRoomManager {
  private voiceRooms = new Map<string, VoiceRoom>(); // channelId -> room
  private userVoiceStates = new Map<string, string>(); // userId -> channelId

  /**
   * Join a voice channel
   */
  async joinVoiceChannel(socket: Socket & { user?: any }, channelId: string): Promise<{ success: boolean; error?: string; participants?: VoiceParticipant[] }> {
    if (!socket.user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Get channel info
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: { server: true }
      });

      if (!channel) {
        return { success: false, error: 'Channel not found' };
      }

      if (channel.type !== 'voice') {
        return { success: false, error: 'Channel is not a voice channel' };
      }

      // Check if user is member of the server
      const membership = await prisma.serverMember.findUnique({
        where: {
          serverId_userId: {
            serverId: channel.serverId,
            userId: socket.user.id
          }
        }
      });

      if (!membership) {
        return { success: false, error: 'Not a member of this server' };
      }

      // Leave current voice channel if any
      const currentChannelId = this.userVoiceStates.get(socket.user.id);
      if (currentChannelId && currentChannelId !== channelId) {
        console.log(`User ${socket.user.username} leaving channel ${currentChannelId} to join ${channelId}`);
        await this.leaveVoiceChannel(socket);
      }

      // Get or create voice room
      let room = this.voiceRooms.get(channelId);
      if (!room) {
        room = {
          channelId,
          serverId: channel.serverId,
          participants: new Map(),
          maxParticipants: channel.maxParticipants || undefined
        };
        this.voiceRooms.set(channelId, room);
      }

      // Check participant limit
      if (room.maxParticipants && room.participants.size >= room.maxParticipants) {
        return { success: false, error: 'Voice channel is full' };
      }

      // Remove any existing sockets for this user in this channel
      const existingSockets = Array.from(room.participants.entries())
        .filter(([_, participant]) => participant.userId === socket.user.id);
      
      existingSockets.forEach(([socketId, _]) => {
        console.log(`Removing existing socket ${socketId} for user ${socket.user.username} in channel ${channelId}`);
        room!.participants.delete(socketId);
      });

      // Create participant
      const participant: VoiceParticipant = {
        userId: socket.user.id,
        socketId: socket.id,
        username: socket.user.username,
        discriminator: socket.user.discriminator,
        avatar: socket.user.avatar,
        isMuted: false,
        isDeafened: false,
        isSpeaking: false,
        joinedAt: new Date()
      };

      // Add to room
      room.participants.set(socket.id, participant);
      this.userVoiceStates.set(socket.user.id, channelId);

      // Join socket room
      socket.join(channelId);

      // Update database voice state
      await prisma.voiceState.upsert({
        where: { userId: socket.user.id },
        update: {
          channelId,
          isMuted: false,
          isDeafened: false,
          isSpeaking: false,
          joinedAt: new Date()
        },
        create: {
          userId: socket.user.id,
          channelId,
          isMuted: false,
          isDeafened: false,
          isSpeaking: false
        }
      });

      // Emit user joined event to ALL clients in the server (not just the channel)
      const io = getIO();
      console.log(`Emitting voice:userJoined event for user ${socket.user.username} joining channel ${channelId}`);
      io.to(channel.serverId).emit('voice:userJoined', {
        channelId,
        userId: socket.user.id,
        username: socket.user.username,
        discriminator: socket.user.discriminator,
        avatar: socket.user.avatar,
        socketId: socket.id,
        joinedAt: participant.joinedAt
      });

      // Return current participants
      const participants = Array.from(room.participants.values());
      return { success: true, participants };

    } catch (error) {
      console.error('Error joining voice channel:', error);
      return { success: false, error: 'Failed to join voice channel' };
    }
  }

  /**
   * Leave voice channel
   */
  async leaveVoiceChannel(socket: Socket & { user?: any }): Promise<{ success: boolean; error?: string }> {
    if (!socket.user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const currentChannelId = this.userVoiceStates.get(socket.user.id);
      
      if (!currentChannelId) {
        return { success: true }; // Not in a voice channel
      }

      const room = this.voiceRooms.get(currentChannelId);
      if (!room) {
        this.userVoiceStates.delete(socket.user.id);
        return { success: true };
      }

      // Remove from room
      room.participants.delete(socket.id);

      // Remove user voice state
      this.userVoiceStates.delete(socket.user.id);

      // Leave socket room
      socket.leave(currentChannelId);

      // Emit user left event to ALL clients in the server (not just the channel)
      const io = getIO();
      console.log(`Emitting voice:userLeft event for user ${socket.user.username} leaving channel ${currentChannelId}`);
      io.to(room.serverId).emit('voice:userLeft', {
        channelId: currentChannelId,
        userId: socket.user.id,
        socketId: socket.id
      });

      // Update database
      await prisma.voiceState.delete({
        where: { userId: socket.user.id }
      }).catch(() => {
        // Ignore errors if voice state doesn't exist
      });

      // Clean up empty room
      if (room.participants.size === 0) {
        this.voiceRooms.delete(currentChannelId);
      }

      return { success: true };

    } catch (error) {
      console.error('Error leaving voice channel:', error);
      return { success: false, error: 'Failed to leave voice channel' };
    }
  }

  /**
   * Update user voice state (mute, deafen, speaking)
   */
  async updateVoiceState(socket: Socket & { user?: any }, updates: { isMuted?: boolean; isDeafened?: boolean; isSpeaking?: boolean }): Promise<{ success: boolean; error?: string }> {
    if (!socket.user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const channelId = this.userVoiceStates.get(socket.user.id);
      if (!channelId) {
        return { success: false, error: 'Not in a voice channel' };
      }

      const room = this.voiceRooms.get(channelId);
      if (!room) {
        return { success: false, error: 'Voice room not found' };
      }

      const participant = room.participants.get(socket.id);
      if (!participant) {
        return { success: false, error: 'Participant not found' };
      }

      // Update participant state
      if (updates.isMuted !== undefined) participant.isMuted = updates.isMuted;
      if (updates.isDeafened !== undefined) participant.isDeafened = updates.isDeafened;
      if (updates.isSpeaking !== undefined) participant.isSpeaking = updates.isSpeaking;

      // Update database
      await prisma.voiceState.update({
        where: { userId: socket.user.id },
        data: updates
      });

      // Notify other participants (now all users in the server)
      const io = getIO();
      io.to(room.serverId).emit('voice:stateUpdate', {
        userId: socket.user.id,
        socketId: socket.id,
        ...updates
      });

      return { success: true };

    } catch (error) {
      console.error('Error updating voice state:', error);
      return { success: false, error: 'Failed to update voice state' };
    }
  }

  /**
   * Get voice channel participants
   */
  getVoiceChannelParticipants(channelId: string): VoiceParticipant[] {
    const room = this.voiceRooms.get(channelId);
    return room ? Array.from(room.participants.values()) : [];
  }

  /**
   * Get user's current voice channel
   */
  getUserVoiceChannel(userId: string): string | null {
    return this.userVoiceStates.get(userId) || null;
  }

  /**
   * Handle user disconnection
   */
  async handleUserDisconnect(socket: Socket & { user?: any }) {
    console.log(`User disconnect handler called for socket ${socket.id}, user: ${socket.user?.username}`);
    if (socket.user) {
      console.log(`Processing voice channel leave for disconnected user: ${socket.user.username}`);
      await this.leaveVoiceChannel(socket);
    }
  }

  /**
   * Get all voice rooms for a server
   */
  getServerVoiceRooms(serverId: string): VoiceRoom[] {
    return Array.from(this.voiceRooms.values()).filter(room => room.serverId === serverId);
  }
}

export const voiceRoomManager = new VoiceRoomManager(); 