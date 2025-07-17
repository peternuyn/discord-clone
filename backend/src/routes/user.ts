import express from 'express';
import { getUserProfile, updateProfile, getUsers, getOnlineUsers, getOnlineUsersForServer, isUserOnline } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/me', authMiddleware, getUserProfile);
router.put('/me', authMiddleware, updateProfile);
router.get('/', authMiddleware, getUsers);

// Online users endpoints
router.get('/online', authMiddleware, getOnlineUsers);
router.get('/online/server/:serverId', authMiddleware, getOnlineUsersForServer);
router.get('/online/:userId', authMiddleware, isUserOnline);

export default router; 