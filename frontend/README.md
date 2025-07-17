# Discord Clone Frontend

A modern Discord clone frontend built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Authentication**: Complete login/register system connected to Express backend
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Modern UI**: Beautiful Discord-inspired interface with dark theme
- **Real-time Ready**: Prepared for WebSocket integration
- **TypeScript**: Full type safety throughout the application

## 🛠️ Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   # Create .env.local file
   echo 'NEXT_PUBLIC_API_URL=http://localhost:5000/api' > .env.local
   ```

3. **Start the backend server** (in another terminal):
   ```bash
   cd ../backend
   npm run dev
   ```

4. **Start the frontend development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication Flow

### Login Process
1. User enters email and password on `/login`
2. Frontend sends credentials to backend API
3. Backend validates credentials and returns JWT token
4. Token is stored in HTTP-only cookie
5. User is redirected to `/dashboard`
6. Protected routes check authentication status

### Registration Process
1. User fills out registration form on `/register`
2. Frontend validates input and sends to backend
3. Backend creates user account and returns JWT token
4. User is automatically logged in and redirected

### Protected Routes
- `/dashboard` - Main application (requires authentication)
- Unauthenticated users are automatically redirected to `/login`

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── dashboard/         # Main dashboard (protected)
│   └── layout.tsx         # Root layout with AuthProvider
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── auth/             # Authentication components
│   ├── chat/             # Chat-related components
│   └── ProtectedRoute.tsx # Route protection component
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication state management
├── services/             # API services
│   └── api.ts           # Backend API client
├── types/               # TypeScript type definitions
│   └── auth.ts          # Authentication types
└── lib/                 # Utility functions
    └── utils.ts         # General utilities
```

## 🔧 API Integration

### Backend Connection
- **Base URL**: `http://localhost:5000/api`
- **Authentication**: HTTP-only cookies with JWT tokens
- **CORS**: Configured for cross-origin requests

### Available Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

## 🎨 UI Components

### Authentication Pages
- **Login Page**: Email/password form with error handling
- **Register Page**: User registration with validation
- **Protected Dashboard**: Main application interface

### Features
- **Responsive Design**: Works on desktop and mobile
- **Dark Theme**: Discord-inspired color scheme
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages

## 🚀 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🔗 Backend Integration

This frontend is designed to work with the Express.js backend:

1. **Database**: SQLite with Prisma ORM
2. **Authentication**: JWT tokens with HTTP-only cookies
3. **API**: RESTful endpoints with proper error handling
4. **Security**: bcrypt password hashing, CORS, rate limiting

## 🎯 Next Steps

- [ ] Add real-time messaging with Socket.IO
- [ ] Implement file upload for avatars
- [ ] Add server and channel management
- [ ] Create user profile editing
- [ ] Add friend system
- [ ] Implement voice channels
- [ ] Add message reactions and emojis

## 🧪 Testing

### Manual Testing
1. Start both backend and frontend servers
2. Navigate to `http://localhost:3000`
3. Try registering a new account
4. Test login with existing credentials
5. Verify protected routes work correctly

### Test Credentials
- **Email**: `test@example.com`
- **Password**: `password123`

## 📝 Notes

- The frontend automatically redirects to `/dashboard` after successful login
- Protected routes show a loading spinner while checking authentication
- All API calls include credentials for cookie-based authentication
- Error messages are displayed inline on forms
