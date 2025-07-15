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

    // Only allow owner to update
    const server = await prisma.server.findUnique({ where: { id } });
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    if (server.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the server owner can update the server.' });
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
 * Deletes a server
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

    // Only allow owner to delete
    const server = await prisma.server.findUnique({ where: { id } });
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    if (server.ownerId !== userId) {
      return res.status(403).json({ error: 'Only the server owner can delete the server.' });
    }

    await prisma.server.delete({ where: { id } });
    return res.json({ message: 'Server deleted successfully.' });
  } catch (error) {
    console.error('Delete server error:', error);
    return res.status(500).json({ error: 'Failed to delete server.' });
  }
}; 