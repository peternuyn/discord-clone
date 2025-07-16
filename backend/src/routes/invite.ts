import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { createInvite, redeemInvite, listServerInvites, getInviteByCode } from '../controllers/inviteController';

const router = express.Router();

// POST /api/invites - create a new invite
router.post('/', authMiddleware, createInvite);

// POST /api/invites/redeem - redeem an invite
router.post('/redeem', authMiddleware, redeemInvite);

// GET /api/servers/:serverId/invites - list invites for a server
router.get('/server/:serverId', authMiddleware, listServerInvites);

// GET /api/invites/:code - get invite by code (public)
router.get('/:code', getInviteByCode);

export default router; 