import express from 'express';
import { createServer, getUserServers, updateServer, deleteServer } from '../controllers/serverController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// POST /api/servers - create a new server
router.post('/', authMiddleware, createServer);

// GET /api/servers - get all servers for the current user
router.get('/', authMiddleware, getUserServers);

// PUT /api/servers/:id - update a server
router.put('/:id', authMiddleware, updateServer);
// DELETE /api/servers/:id - delete a server
router.delete('/:id', authMiddleware, deleteServer);

export default router; 