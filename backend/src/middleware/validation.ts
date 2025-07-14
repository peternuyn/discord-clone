import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../lib/auth';
import { z } from 'zod';

/**
 * The purpose of this validation is to ensure that the data is valid 
 * and meets the requirements before it is processed by the server.
 */


/**
 * Schema for validating profile updates
 * Allows optional updates to username, bio, location and avatar
 */
const profileUpdateSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores'
  }).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  avatar: z.string().url().optional(),
});

/**
 * Middleware to validate user registration data
 * Checks username, email, password and password confirmation
 */
export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  try {
    registerSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    next(error);
  }
};

/**
 * Middleware to validate user login data
 * Checks email and password
 */
export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    next(error);
  }
};

/**
 * Middleware to validate profile update data
 * Ensures optional fields meet requirements if provided
 */
export const validateProfile = (req: Request, res: Response, next: NextFunction) => {
  try {
    profileUpdateSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    next(error);
  }
}; 