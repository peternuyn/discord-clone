import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Server controller containing endpoints for managing Discord-like servers
 */

/**
 * Creates a new server
 * @param req Request containing server name, description, and icon
 * @param res Response
 * @returns Newly created server object
 */
export const createServer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, icon } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Server name is required and must be at least 2 characters.' });
    }

    // Create the server
    const server = await prisma.server.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || null,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
        channels: {
          create: {
            name: 'general',
            type: 'text',
            position: 0,
          },
        },
      },
      include: {
        members: true,
        channels: true,
      },
    });

    return res.status(201).json(server);
  } catch (error) {
    console.error('Create server error:', error);
    return res.status(500).json({ error: 'Failed to create server.' });
  }
};

/**
 * Gets all servers that a user is a member of
 * @param req Request containing user ID
 * @param res Response
 * @returns Array of server objects
 */
export const getUserServers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find all servers where the user is a member
    const servers = await prisma.server.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        channels: true,
        members: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(servers);
  } catch (error) {
    console.error('Get user servers error:', error);
    return res.status(500).json({ error: 'Failed to fetch servers.' });
  }
};

/**
 * Updates an existing server's details
 * @param req Request containing server ID and updated fields
 * @param res Response
 * @returns Updated server object
 */
export const updateServer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, description, icon } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is the server owner or has admin role
    const server = await prisma.server.findUnique({
      where: { id },
      include: { members: true },
    });
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const userMember = server.members.find(m => m.userId === userId);
    if (!userMember) {
      return res.status(403).json({ error: 'Not a member of this server' });
    }

    // Only owners and admins can update servers
    if (server.ownerId !== userId && userMember.role !== 'admin') {
      return res.status(403).json({ error: 'Only server owners and admins can update the server.' });
    }

    const updated = await prisma.server.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon && { icon }),
      },
      include: {
        members: true,
        channels: true,
      },
    });
    return res.json(updated);
  } catch (error) {
    console.error('Update server error:', error);
    return res.status(500).json({ error: 'Failed to update server.' });
  }
};

/**
 * Quits/leaves a server (for non-owners)
 * @param req Request containing server ID
 * @param res Response
 * @returns Success message
 */
export const quitServer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is a member of the server
    const serverMember = await prisma.serverMember.findUnique({
      where: { serverId_userId: { serverId: id, userId } },
      include: { server: true },
    });

    if (!serverMember) {
      return res.status(404).json({ error: 'Not a member of this server' });
    }

    // Check if user is the owner (owners can't quit, they must delete)
    if (serverMember.server.ownerId === userId) {
      return res.status(403).json({ error: 'Server owners cannot quit. Use delete server instead.' });
    }

    // Remove the user from the server
    await prisma.serverMember.delete({
      where: { serverId_userId: { serverId: id, userId } },
    });

    return res.json({ message: 'Successfully left the server' });
  } catch (error) {
    console.error('Quit server error:', error);
    return res.status(500).json({ error: 'Failed to quit server.' });
  }
};

/**
 * Deletes a server (only for owners/admins)
 * @param req Request containing server ID
 * @param res Response
 * @returns Success message
 */
export const deleteServer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is the server owner or has admin role
    const server = await prisma.server.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const userMember = server.members.find(m => m.userId === userId);
    if (!userMember) {
      return res.status(403).json({ error: 'Not a member of this server' });
    }

    // Only owners and admins can delete servers
    if (server.ownerId !== userId && userMember.role !== 'admin') {
      return res.status(403).json({ error: 'Only server owners and admins can delete the server' });
    }

    await prisma.server.delete({ where: { id } });
    return res.json({ message: 'Server deleted successfully.' });
  } catch (error) {
    console.error('Delete server error:', error);
    return res.status(500).json({ error: 'Failed to delete server.' });
  }
}; 