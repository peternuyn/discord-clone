import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { getChannel, createChannel, updateChannel, deleteChannel, getChannelMessages, createMessage } from '../controllers/channelController';

const router = express.Router();

router.get('/:id', authMiddleware, getChannel);
router.post('/server/:serverId', authMiddleware, createChannel);
router.put('/:id', authMiddleware, updateChannel);
router.delete('/:id', authMiddleware, deleteChannel);
router.get('/:id/messages', authMiddleware, getChannelMessages);
router.post('/:id/messages', authMiddleware, createMessage);

export default router; 