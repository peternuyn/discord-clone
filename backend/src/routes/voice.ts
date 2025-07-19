import { Router } from 'express';
import { prisma } from '../lib/db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { voiceRoomManager } from '../realtime/voiceRoomManager';

const router = Router();

// Get voice channel participants
router.get('/channels/:channelId/participants', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user!.id;

    // Check if user is member of the server that contains this channel
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        server: {
          include: {
            members: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    if (channel.type !== 'voice') {
      return res.status(400).json({ error: 'Channel is not a voice channel' });
    }

    if (channel.server.members.length === 0) {
      return res.status(403).json({ error: 'Not a member of this server' });
    }

    // Get participants from voice room manager
    const participants = voiceRoomManager.getVoiceChannelParticipants(channelId);

    res.json({ participants });
  } catch (error) {
    console.error('Error getting voice channel participants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's current voice state
router.get('/user/state', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const voiceState = await prisma.voiceState.findUnique({
      where: { userId },
      include: {
        channel: {
          include: {
            server: true
          }
        }
      }
    });

    res.json({ voiceState });
  } catch (error) {
    console.error('Error getting user voice state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all voice channels for a server
router.get('/servers/:serverId/channels', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!.id;

    // Check if user is member of the server
    const membership = await prisma.serverMember.findUnique({
      where: {
        serverId_userId: {
          serverId,
          userId
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this server' });
    }

    // Get voice channels
    const voiceChannels = await prisma.channel.findMany({
      where: {
        serverId,
        type: 'voice'
      },
      orderBy: {
        position: 'asc'
      }
    });

    // Get participants for each channel
    const channelsWithParticipants = voiceChannels.map(channel => ({
      ...channel,
      participants: voiceRoomManager.getVoiceChannelParticipants(channel.id)
    }));

    res.json({ channels: channelsWithParticipants });
  } catch (error) {
    console.error('Error getting server voice channels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 