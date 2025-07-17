// To use this file, run: npm install socket.io
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { authenticateSocket } from './socketAuth';
import { onlineUsersService } from './onlineUsers';
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
    console.log('A user connected:', socket.id);
    
    // Add user to online users if authenticated
    if (socket.user) {
      onlineUsersService.addUser(socket, socket.user);
      
      // Get all servers the user is a member of
      getUserServers(socket.user.id).then(servers => {
        // Emit user online event only to members of the same servers
        servers.forEach(server => {
          socket.to(server.id).emit('user:online', {
            userId: socket.user.id,
            username: socket.user.username,
            discriminator: socket.user.discriminator,
            avatar: socket.user.avatar,
          });
        });
      });
    }

    // Handle joining a channel room
    socket.on('join', (channelId: string) => {
      socket.join(channelId);
      console.log(`User ${socket.id} joined channel ${channelId}`);
    });

    // Handle joining a server room
    socket.on('joinServer', (serverId: string) => {
      socket.join(serverId);
      console.log(`User ${socket.id} joined server ${serverId}`);
    });

    // Handle leaving a channel room
    socket.on('leave', (channelId: string) => {
      socket.leave(channelId);
      console.log(`User ${socket.id} left channel ${channelId}`);
    });

    // Handle leaving a server room
    socket.on('leaveServer', (serverId: string) => {
      socket.leave(serverId);
      console.log(`User ${socket.id} left server ${serverId}`);
    });

    // Handle new messages from clients
    socket.on('message:new', (data: any) => {
      // Broadcast message to all clients in the same channel
      socket.to(data.channelId || 'general').emit('message:new', data);
    });

    // Handle client disconnections
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove user from online users
      if (socket.user) {
        onlineUsersService.removeUser(socket.id);
        
        // Get all servers the user was a member of
        getUserServers(socket.user.id).then(servers => {
          // Emit user offline event only to members of the same servers
          servers.forEach(server => {
            socket.to(server.id).emit('user:offline', {
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