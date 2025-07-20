// To use this file, run: npm install socket.io
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { authenticateSocket } from './socketAuth';
import { onlineUsersService } from './onlineUsers';
import { voiceRoomManager } from './voiceRoomManager';
import { prisma } from '../lib/db';

/**
 * Global Socket.IO server instance
 */
let io: SocketIOServer | null = null;

/**
 * Helper function to get user's servers
 */
async function getUserServers(userId: string) {
  return await prisma.server.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    select: { id: true },
  });
}

/**
 * Initializes the Socket.IO server with the HTTP server
 * Sets up connection handling and event listeners
 * 
 * @param server - HTTP server instance to attach Socket.IO to
 * @returns Configured Socket.IO server instance
 */
export function initSocketServer(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Adjust as needed for production
      methods: ['GET', 'POST'],
    },
  });

  // Add authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket: Socket & { user?: any }) => {
    
    // Add user to online users if authenticated
    if (socket.user) {
      onlineUsersService.addUser(socket, socket.user);
      
      // Get all servers the user is a member of
      getUserServers(socket.user.id).then(servers => {
        // Emit user online event only to members of the same servers
        servers.forEach(server => {
          getIO().to(server.id).emit('user:online', {
            userId: socket.user.id,
            username: socket.user.username,
            discriminator: socket.user.discriminator,
            avatar: socket.user.avatar,
          });
        });
      });
    }

    // Handle joining a channel room
    socket.on('join', async (channelId: string) => {
      socket.join(channelId);
      // Log sockets in the room after join
      if (io) {
        const sockets = await io.in(channelId).allSockets();
      }
    });

    // Handle joining a server room
    socket.on('joinServer', (serverId: string) => {
      socket.join(serverId);
    });

    // Handle leaving a channel room
    socket.on('leave', async (channelId: string) => {
      socket.leave(channelId);
      // Log sockets in the room after leave
      if (io) {
        const sockets = await io.in(channelId).allSockets();
      }
    });

    // Handle leaving a server room
    socket.on('leaveServer', (serverId: string) => {
      socket.leave(serverId);
    });

    // Voice channel events
    socket.on('voice:join', async (channelId: string) => {
      const result = await voiceRoomManager.joinVoiceChannel(socket, channelId);
      
      if (result.success) {
        socket.emit('voice:joined', {
          channelId,
          participants: result.participants
        });
      } else {
        socket.emit('voice:error', { error: result.error });
      }
    });

    socket.on('voice:leave', async () => {
      const result = await voiceRoomManager.leaveVoiceChannel(socket);
      if (result.success) {
        socket.emit('voice:left');
      } else {
        socket.emit('voice:error', { error: result.error });
      }
    });

    socket.on('voice:updateState', async (updates: { isMuted?: boolean; isDeafened?: boolean; isSpeaking?: boolean }) => {
      const result = await voiceRoomManager.updateVoiceState(socket, updates);
      if (!result.success) {
        socket.emit('voice:error', { error: result.error });
      }
    });

    socket.on('voice:getState', async () => {
      const result = await voiceRoomManager.getUserVoiceState(socket);
      if (result.success) {
        socket.emit('voice:stateUpdate', {
          userId: socket.user?.id,
          socketId: socket.id,
          ...result.state
        });
      }
    });

    // WebRTC signaling events
    socket.on('voice:signal', (data: { toUserId: string; fromUserId: string; data: any }) => {
      
      // Find the target user's socket
      const targetSocket = Array.from(io!.sockets.sockets.values())
        .find((s: any) => s.user?.id === data.toUserId);
      
      if (targetSocket) {
        targetSocket.emit('voice:signal', {
          fromUserId: data.fromUserId,
          data: data.data
        });
      }
    });

    // Handle new messages from clients
    socket.on('message:new', (data: any) => {
      // Broadcast message to all clients in the same channel
      socket.to(data.channelId || 'general').emit('message:new', data);
    });

    // Handle client disconnections
    socket.on('disconnect', () => {
      
      // Remove user from online users and voice channels
      if (socket.user) {
        onlineUsersService.removeUser(socket.id);
        voiceRoomManager.handleUserDisconnect(socket);
        
        // Get all servers the user was a member of
        getUserServers(socket.user.id).then(servers => {
          // Emit user offline event only to members of the same servers
          servers.forEach(server => {
            getIO().to(server.id).emit('user:offline', {
              userId: socket.user.id,
              username: socket.user.username,
              discriminator: socket.user.discriminator,
            });
          });
        });
      }
    });
  });

  return io;
}

/**
 * Get the Socket.IO server instance
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO server not initialized');
  }
  return io;
}