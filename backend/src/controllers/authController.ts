import { Request, Response } from 'express';
import { prisma } from '../lib/db';
import { hashPassword, verifyPassword, generateToken, generateDiscriminator } from '../lib/auth';
import { RegisterInput, LoginInput } from '../lib/auth';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, confirmPassword }: RegisterInput = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        details: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

    // Generate unique discriminator
    let discriminator: string;
    let isUnique = false;
    
    while (!isUnique) {
      discriminator = generateDiscriminator();
      const existingDiscriminator = await prisma.user.findFirst({
        where: { discriminator }
      });
      if (!existingDiscriminator) {
        isUnique = true;
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        discriminator: discriminator!,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      },
      select: {
        id: true,
        username: true,
        email: true,
        discriminator: true,
        avatar: true,
        status: true,
        createdAt: true,
        password: false,
      }
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user
    });

  } catch (error) {
    console.error('Registration error:', error);
     return res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginInput = req.body;
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Update user status to online
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'online' }
    });

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        discriminator: user.discriminator,
        avatar: user.avatar,
        status: 'online',
        bio: user.bio,
        location: user.location,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;
    
    if (token) {
      // Clear the token cookie
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        discriminator: true,
        avatar: true,
        status: true,
        bio: true,
        location: true,
        createdAt: true,
        password: false,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 