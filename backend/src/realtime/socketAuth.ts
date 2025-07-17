import { Socket } from 'socket.io';
import { verifyToken } from '../lib/auth';
import { prisma } from '../lib/db';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
  };
}

export async function authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
  try {
    // Get token from handshake auth, query, or cookies
    let token = socket.handshake.auth.token || 
                socket.handshake.query.token as string;

    // If no token in auth/query, try to get from cookies
    if (!token) {
      const cookies = socket.handshake.headers.cookie;
      if (cookies) {
        const tokenMatch = cookies.match(/token=([^;]+)/);
        if (tokenMatch && tokenMatch[1]) {
          token = tokenMatch[1];
        }
      }
    }

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Invalid or expired token'));
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        discriminator: true,
        avatar: true,
      }
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user to socket
    socket.user = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatar || undefined,
    };
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
} 