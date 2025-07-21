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
    return res.json(channel);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch channel' });
  }
};

// Create a new channel in a server
export const createChannel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });

    console.log('Creating channel:', { serverId, name, type });

    const channel = await prisma.channel.create({
      data: {
        name,
        type,
        serverId,
        position: 0, // or calculate next position
      },
    });
    
    console.log('Channel created:', channel);
    console.log('Emitting socket event to server room:', serverId);
    
    // Emit socket event to all clients in the server
    getIO().to(serverId).emit('channel:new', channel);
    
    // Test event to see if socket is working
    getIO().to(serverId).emit('test:event', { message: 'Test event from channel creation', channelId: channel.id });
    
    console.log('Socket event emitted successfully');
    
    return res.status(201).json(channel);
  } catch (error) {
    console.error('Error creating channel:', error);
    return res.status(500).json({ error: 'Failed to create channel' });
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
    
    // Emit socket event to all clients in the server
    getIO().to(updated.serverId).emit('channel:update', updated);
    
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update channel' });
  }
};

// Delete a channel
export const deleteChannel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get channel info before deletion for socket emission
    const channel = await prisma.channel.findUnique({ where: { id } });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    
    await prisma.channel.delete({ where: { id } });
    
    // Emit socket event to all clients in the server
    getIO().to(channel.serverId).emit('channel:delete', id);
    
    return res.json({ message: 'Channel deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete channel' });
  }
};

// Get all messages for a channel
export const getChannelMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params; // channelId
    const { limit = 100, offset = 0 } = req.query; // Add pagination
    
    const messages = await prisma.message.findMany({
      where: { channelId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        },
      },
      take: Number(limit),
      skip: Number(offset),
    });
    
    // Aggregate reactions by emoji for each message
    const processedMessages = messages.map(message => {
      const reactionMap = new Map();
      message.reactions.forEach(reaction => {
        const key = reaction.emoji;
        if (!reactionMap.has(key)) {
          reactionMap.set(key, {
            emoji: key,
            count: 0,
            users: []
          });
        }
        const aggregated = reactionMap.get(key);
        aggregated.count += 1;
        aggregated.users.push({
          id: reaction.user.id,
          username: reaction.user.username,
          avatar: reaction.user.avatar
        });
      });
      return {
        ...message,
        reactions: Array.from(reactionMap.values())
      };
    });
    
    // Get total count for pagination info
    const totalCount = await prisma.message.count({
      where: { channelId: id },
    });
    
    return res.json({
      messages: processedMessages,
      pagination: {
        total: totalCount,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < totalCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
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
    // Emit socket event to all clients in the channel
    getIO().to(id).emit('message:new', { ...message, channelId: id });
    return res.status(201).json(message);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create message' });
  }
}; 