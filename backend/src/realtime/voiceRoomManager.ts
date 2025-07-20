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
        room!.participants.delete(socketId);
      });

      // Get user's current voice state from database
      const userVoiceState = await prisma.voiceState.findUnique({
        where: { userId: socket.user.id }
      });

      // Create participant with stored voice state
      const participant: VoiceParticipant = {
        userId: socket.user.id,
        socketId: socket.id,
        username: socket.user.username,
        discriminator: socket.user.discriminator,
        avatar: socket.user.avatar,
        isMuted: userVoiceState?.isMuted ?? false,
        isDeafened: userVoiceState?.isDeafened ?? false,
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
          joinedAt: new Date()
        },
        create: {
          userId: socket.user.id,
          channelId,
          isMuted: userVoiceState?.isMuted ?? false,
          isDeafened: userVoiceState?.isDeafened ?? false,
          isSpeaking: false
        }
      });

      // Emit user joined event to ALL clients in the server (not just the channel)
      const io = getIO();
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
      // Always update the user's global voice state in the DB
      await prisma.voiceState.upsert({
        where: { userId: socket.user.id },
        update: updates,
        create: {
          userId: socket.user.id,
          channelId: null,
          isMuted: updates.isMuted ?? false,
          isDeafened: updates.isDeafened ?? false,
          isSpeaking: updates.isSpeaking ?? false,
        },
      });

      // If the user is in a channel, update the participant and notify others
      const channelId = this.userVoiceStates.get(socket.user.id);
      if (channelId) {
        const room = this.voiceRooms.get(channelId);
        if (room) {
          const participant = room.participants.get(socket.id);
          if (participant) {
            if (updates.isMuted !== undefined) participant.isMuted = updates.isMuted;
            if (updates.isDeafened !== undefined) participant.isDeafened = updates.isDeafened;
            if (updates.isSpeaking !== undefined) participant.isSpeaking = updates.isSpeaking;

            // Notify other participants
            const io = getIO();
            io.to(room.serverId).emit('voice:stateUpdate', {
              userId: socket.user.id,
              socketId: socket.id,
              ...updates,
            });
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('VoiceRoomManager: Error updating voice state:', error);
      return { success: false, error: 'Failed to update voice state' };
    }
  }

  /**
   * Get user's current voice state
   */
  async getUserVoiceState(socket: Socket & { user?: any }): Promise<{ success: boolean; error?: string; state?: any }> {
    if (!socket.user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const voiceState = await prisma.voiceState.findUnique({
        where: { userId: socket.user.id }
      });

      return { 
        success: true, 
        state: voiceState ? {
          isMuted: voiceState.isMuted,
          isDeafened: voiceState.isDeafened,
          isSpeaking: voiceState.isSpeaking
        } : {
          isMuted: false,
          isDeafened: false,
          isSpeaking: false
        }
      };
    } catch (error) {
      console.error('VoiceRoomManager: Error getting user voice state:', error);
      return { success: false, error: 'Failed to get user voice state' };
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
    if (socket.user) {
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