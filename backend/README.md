# Discord Clone Backend

A complete authentication backend system for the Discord clone with Express.js, Prisma ORM, and JWT tokens.

## 🚀 Features

- **User Authentication**: Register, login, logout with JWT tokens
- **Password Security**: bcryptjs hashing with salt rounds
- **Input Validation**: Zod schemas for request validation
- **Database**: SQLite with Prisma ORM
- **Security**: Rate limiting, CORS, Helmet
- **Error Handling**: Centralized error handling middleware
- **TypeScript**: Full type safety

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.ts    # Authentication logic
│   │   └── userController.ts    # User profile management
│   ├── lib/
│   │   ├── auth.ts             # Auth utilities (JWT, bcrypt)
│   │   └── db.ts               # Prisma client
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication middleware
│   │   ├── validation.ts       # Request validation
│   │   └── errorHandler.ts     # Error handling
│   ├── routes/
│   │   ├── auth.ts             # Auth routes
│   │   └── user.ts             # User routes
│   └── index.ts                # Express server
├── prisma/
│   └── schema.prisma           # Database schema
├── package.json
├── tsconfig.json
└── .env
```

## 🛠️ Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

4. **Push database schema**:
   ```bash
   npx prisma db push
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

## 🔐 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user (protected)

### User Management

- `GET /api/user/profile` - Get user profile (protected)
- `PUT /api/user/profile` - Update user profile (protected)
- `GET /api/user/users` - Get all users (protected)

## 📊 Database Schema

### User Model
```typescript
model User {
  id            String   @id @default(cuid())
  username      String   @unique
  email         String   @unique
  password      String
  discriminator String   @unique // Discord-style #1234
  avatar        String?
  status        String   @default("offline")
  bio           String?
  location      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastSeen      DateTime @default(now())
}
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs with 12 salt rounds
- **JWT Tokens**: 7-day expiration with HTTP-only cookies
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **Input Validation**: Zod schemas for all inputs

## 🧪 Testing the API

### Register a new user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get current user (with cookie):
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Cookie: token=your-jwt-token"
```

## 🚀 Production Deployment

1. **Environment Variables**:
   - Set `NODE_ENV=production`
   - Use strong `JWT_SECRET`
   - Configure production database URL

2. **Build**:
   ```bash
   npm run build
   npm start
   ```

3. **Database**:
   - Use PostgreSQL for production
   - Run migrations: `npx prisma migrate deploy`

## 🔧 Development

- **Database Studio**: `npm run db:studio`
- **Generate Client**: `npm run db:generate`
- **Push Schema**: `npm run db:push`
- **Watch Mode**: `npm run dev`

## 📝 Environment Variables

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
PORT=5000
NODE_ENV="development"
```

## 🔗 Frontend Integration

The backend is designed to work with the Next.js frontend:

1. **CORS**: Configured for `http://localhost:3000`
2. **Cookies**: HTTP-only JWT tokens
3. **API Base URL**: `http://localhost:5000/api`

## 🎯 Next Steps

- [ ] Add email verification
- [ ] Implement password reset
- [ ] Add OAuth providers (Google, Discord)
- [ ] Real-time features with Socket.IO
- [ ] File upload for avatars
- [ ] Server and channel management
- [ ] Message and reaction system 