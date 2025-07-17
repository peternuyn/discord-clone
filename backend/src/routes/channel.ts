import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { getChannel, createChannel, updateChannel, deleteChannel, getChannelMessages, createMessage } from '../controllers/channelController';
import { addReaction, removeReaction } from '../controllers/reactionController';

const router = express.Router();

router.get('/:id', authMiddleware, getChannel);
router.post('/', authMiddleware, createChannel);
router.post('/server/:serverId', authMiddleware, createChannel); // Route for creating channels in a specific server
router.put('/:id', authMiddleware, updateChannel);
router.delete('/:id', authMiddleware, deleteChannel);
router.get('/:id/messages', authMiddleware, getChannelMessages);
router.post('/:id/messages', authMiddleware, createMessage);

// Reaction endpoints
router.post('/messages/:messageId/reactions', authMiddleware, addReaction);
router.delete('/messages/:messageId/reactions', authMiddleware, removeReaction);

export default router; 