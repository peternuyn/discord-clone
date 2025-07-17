export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  discriminator: string;
  avatar?: string;
  status: string;
  bio?: string;
  location?: string;
  createdAt: string;
  lastSeen: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface ApiError {
  error: string;
  details?: string[];
} 