import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { onlineUsersService } from '../realtime/onlineUsers';

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        discriminator: true,
        avatar: true,
        status: true,
        bio: true,
        location: true,
        createdAt: true,
        password: false,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });

  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { username, bio, location, avatar } = req.body;

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          error: 'Username already taken'
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(avatar && { avatar }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        discriminator: true,
        avatar: true,
        status: true,
        bio: true,
        location: true,
        createdAt: true,
        password: false,
      }
    });

    return res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { search, limit = 20, offset = 0 } = req.query;
    const currentUserId = (req as any).user?.id;

    const whereClause: any = {
      NOT: { id: currentUserId } // Exclude current user
    };

    if (search) {
      whereClause.OR = [
        { username: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        discriminator: true,
        avatar: true,
        status: true,
        bio: true,
        createdAt: true,
        password: false,
      },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where: whereClause });

    res.json({
      users,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < total
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all online users
 */
export const getOnlineUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const onlineUsers = onlineUsersService.getOnlineUsers();
    
    res.json({
      onlineUsers,
      count: onlineUsers.length,
      totalOnline: onlineUsersService.getOnlineUsersCount()
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ error: 'Failed to get online users' });
  }
};

/**
 * Get online users for a specific server
 */
export const getOnlineUsersForServer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is a member of the server
    const serverMember = await prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId,
          userId
        }
      }
    });

    if (!serverMember) {
      return res.status(403).json({ error: 'Not a member of this server' });
    }

    const onlineUsers = await onlineUsersService.getOnlineUsersForServer(serverId);
    
    return res.json({
      onlineUsers,
      count: onlineUsers.length
    });
  } catch (error) {
    console.error('Get online users for server error:', error);
    return res.status(500).json({ error: 'Failed to get online users for server' });
  }
};

/**
 * Check if a specific user is online
 */
export const isUserOnline = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    const isOnline = onlineUsersService.isUserOnline(userId);
    
    res.json({
      userId,
      isOnline
    });
  } catch (error) {
    console.error('Check user online status error:', error);
    res.status(500).json({ error: 'Failed to check user online status' });
  }
}; 