import { Router } from 'express';
import { updateProfile, getUserProfile, getUsers } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { validateProfile } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// User profile routes
router.get('/profile', getUserProfile);
router.put('/profile', validateProfile, updateProfile);
router.get('/users', getUsers);

export { router as userRoutes }; 