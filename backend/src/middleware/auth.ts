import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';

/**
 * The purpose of this middleware is to authenticate requests
 * by verifying the JWT token and attaching the user info to the request object
 */

/**
 * Extended Request interface that includes the authenticated user information
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Middleware to authenticate requests
 * Checks for JWT token in cookies or Authorization header
 * Verifies the token and attaches user info to request
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token || 
                  req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }

    // Add user info to request
    req.user = { id: decoded.userId };
    return next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      error: 'Authentication failed'
    });
  }
}; 