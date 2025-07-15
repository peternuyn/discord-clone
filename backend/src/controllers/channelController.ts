import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { getIO } from '../realtime/socketServer';

// Get a single channel
export const getChannel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const channel = await prisma.channel.findUnique({ where: { id } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    res.json(channel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
};

// Create a new channel in a server
export const createChannel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });

    const channel = await prisma.channel.create({
      data: {
        name,
        type,
        serverId,
        position: 0, // or calculate next position
      },
    });
    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create channel' });
  }
};

// Update a channel
export const updateChannel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;
    const updated = await prisma.channel.update({
      where: { id },
      data: { ...(name && { name }), ...(type && { type }) },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update channel' });
  }
};

// Delete a channel
export const deleteChannel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.channel.delete({ where: { id } });
    res.json({ message: 'Channel deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete channel' });
  }
};

// Get all messages for a channel
export const getChannelMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params; // channelId
    const messages = await prisma.message.findMany({
      where: { channelId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: true,
        reactions: true,
      },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Create a new message in a channel
export const createMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params; // channelId
    const userId = req.user?.id;
    const { content } = req.body;
    if (!userId || !content) return res.status(400).json({ error: 'Missing user or content' });
    const message = await prisma.message.create({
      data: {
        content,
        userId,
        channelId: id,
      },
      include: {
        user: true,
        reactions: true,
      },
    });
    // Emit socket event to all clients
    getIO().to(id).emit('message:new', message);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create message' });
  }
}; 