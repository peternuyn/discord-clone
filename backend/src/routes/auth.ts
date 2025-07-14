import { Router } from 'express';
import { register, login, logout, getCurrentUser } from '../controllers/authController';
import { validateRegister, validateLogin } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);

export { router as authRoutes }; 