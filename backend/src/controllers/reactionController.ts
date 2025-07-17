import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { getIO } from '../realtime/socketServer';

// Add a reaction to a message
export const addReaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user?.id;

    if (!userId || !emoji) return res.status(400).json({ error: 'Missing user or emoji' });

    // Check if message exists
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { user: true }
    });

    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Check if user already reacted with this emoji
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji
        }
      }
    });

    if (existingReaction) return res.status(400).json({ error: 'User already reacted with this emoji' });

    // Add the reaction
    const reaction = await prisma.reaction.create({
      data: {
        emoji,
        messageId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    // Get updated message with all reactions and aggregate them
    const updatedMessage = await prisma.message.findUnique({
      where: { id: messageId },
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
        }
      }
    });

    // Aggregate reactions by emoji
    const reactionMap = new Map();
    updatedMessage!.reactions.forEach(reaction => {
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

    const aggregatedReactions = Array.from(reactionMap.values());

    // Emit socket event to all clients in the channel
    getIO().to(message.channelId).emit('reaction:added', {
      messageId,
      reactions: aggregatedReactions
    });

    res.status(201).json({
      message: 'Reaction added successfully',
      reaction,
      updatedMessage: {
        ...updatedMessage,
        reactions: aggregatedReactions
      }
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
};

// Remove a reaction from a message
export const removeReaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user?.id;

    if (!userId || !emoji) return res.status(400).json({ error: 'Missing user or emoji' });

    // Check if message exists
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { user: true }
    });

    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Find and delete the reaction
    const reaction = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji
        }
      }
    });

    if (!reaction) return res.status(404).json({ error: 'Reaction not found' });

    await prisma.reaction.delete({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji
        }
      }
    });

    // Get updated message with all reactions and aggregate them
    const updatedMessage = await prisma.message.findUnique({
      where: { id: messageId },
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
        }
      }
    });

    // Aggregate reactions by emoji
    const reactionMap = new Map();
    updatedMessage!.reactions.forEach(reaction => {
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

    const aggregatedReactions = Array.from(reactionMap.values());

    // Emit socket event to all clients in the channel
    getIO().to(message.channelId).emit('reaction:removed', {
      messageId,
      reactions: aggregatedReactions
    });

    res.json({
      message: 'Reaction removed successfully',
      updatedMessage: {
        ...updatedMessage,
        reactions: aggregatedReactions
      }
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
}; 