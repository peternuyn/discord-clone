import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

// Create a new invite (single-use or multi-use)
export const createInvite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { serverId, singleUse, expiresAt } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    // Only server owner or admin can create invites (optional: check role)
    const server = await prisma.server.findUnique({ where: { id: serverId }, include: { members: true } });
    if (!server) return res.status(404).json({ error: 'Server not found' });
    const member = server.members.find(m => m.userId === userId);
    if (!member) return res.status(403).json({ error: 'Not a server member' });
    // Optionally check for admin/owner role here
    const code = uuidv4();
    const invite = await prisma.invite.create({
      data: {
        code,
        serverId,
        singleUse: !!singleUse,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    return res.status(201).json(invite);
  } catch (error) {
    console.error('Create invite error:', error);
    return res.status(500).json({ error: 'Failed to create invite.' });
  }
};

// Redeem an invite (join server)
export const redeemInvite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const invite = await prisma.invite.findUnique({ where: { code }, include: { server: true } });
    if (!invite) return res.status(404).json({ error: 'Invite not found' });
    if (invite.expiresAt && new Date() > invite.expiresAt) return res.status(400).json({ error: 'Invite expired' });
    if (invite.singleUse && invite.used) return res.status(400).json({ error: 'Invite already used' });
    // Check if user is already a member
    const existingMember = await prisma.serverMember.findUnique({ where: { serverId_userId: { serverId: invite.serverId, userId } } });
    if (existingMember) return res.status(400).json({ error: 'Already a member' });
    // Add user to server
    await prisma.serverMember.create({ data: { serverId: invite.serverId, userId } });
    // Mark invite as used if single-use
    if (invite.singleUse) {
      await prisma.invite.update({ where: { code }, data: { used: true, usedById: userId, usedAt: new Date() } });
    }
    return res.json({ message: 'Joined server', server: invite.server });
  } catch (error) {
    console.error('Redeem invite error:', error);
    return res.status(500).json({ error: 'Failed to redeem invite.' });
  }
};

// Get invite by code (public endpoint for invite pages)
export const getInviteByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const invite = await prisma.invite.findUnique({
      where: { code },
      include: {
        server: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    username: true,
                    discriminator: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.expiresAt && new Date() > invite.expiresAt) {
      return res.status(400).json({ error: 'Invite expired' });
    }

    if (invite.singleUse && invite.used) {
      return res.status(400).json({ error: 'Invite already used' });
    }

    return res.json(invite);
  } catch (error) {
    console.error('Get invite error:', error);
    return res.status(500).json({ error: 'Failed to get invite.' });
  }
};

// List invites for a server (admin/owner only)
export const listServerInvites = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const server = await prisma.server.findUnique({ where: { id: serverId }, include: { members: true } });
    if (!server) return res.status(404).json({ error: 'Server not found' });
    const member = server.members.find(m => m.userId === userId);
    if (!member) return res.status(403).json({ error: 'Not a server member' });
    // Optionally check for admin/owner role here
    const invites = await prisma.invite.findMany({ where: { serverId } });
    return res.json(invites);
  } catch (error) {
    console.error('List invites error:', error);
    return res.status(500).json({ error: 'Failed to list invites.' });
  }
}; 