import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  code: number;
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Middleware to handle errors
 * Logs the error and sends a response with the error message and stack trace
 */


/**
 * The purpose of this middleware is to handle errors
 * @param error
 * @param req 
 * @param res 
 * @param next 
 */
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Default error
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value';
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}; 