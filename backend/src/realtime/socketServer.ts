// To use this file, run: npm install socket.io
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

/**
 * Global Socket.IO server instance
 */
let io: SocketIOServer | null = null;

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

  io.on('connection', (socket: Socket) => {
    console.log('A user connected:', socket.id);

    // Handle new messages from clients
    socket.on('message:new', (data: any) => {
      // Broadcast message to all other connected clients
      socket.broadcast.emit('message:new', data);
    });

    // Handle client disconnections
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}

/**
 * Gets the initialized Socket.IO server instance
 * 
 * @throws Error if Socket.IO server is not initialized
 * @returns Socket.IO server instance
 */
export function getIO() {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
}