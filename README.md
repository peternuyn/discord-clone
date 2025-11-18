# Discord Clone

A full-stack Discord clone built with modern technologies.

## 🏗️ Architecture

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Go 1.24, Gin, PostgreSQL, WebSocket
- **Database**: PostgreSQL 16 (Docker)
- **Real-time**: Socket.IO for WebSocket communication

## ⚡ Quick Start

### Using Make (Recommended)

```bash
# Start everything
make dev-all

# Then in separate terminals:
cd backend-go && make dev      # Terminal 2
cd frontend && npm run dev     # Terminal 3
```

Open http://localhost:3000 in your browser!

### Manual Setup

See [QUICKSTART.md](QUICKSTART.md) for detailed instructions.

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 3 minutes
- **[LOCAL_DEV_SETUP.md](LOCAL_DEV_SETUP.md)** - Complete development guide
- **[agent.md](agent.md)** - Migration from Node.js to Go
- **[backend-go/DOCKER_SETUP.md](backend-go/DOCKER_SETUP.md)** - Docker configuration

## 🚀 Features

### Frontend
- ✅ Authentication (login/register)
- ✅ Protected routes
- 🔄 Real-time messaging (frontend ready, needs WebSocket backend)
- ✅ Server and channel management
- 🔄 User presence (frontend ready, needs WebSocket backend)
- ✅ Modern Discord-inspired UI

### Backend
- ✅ JWT authentication
- ✅ RESTful API
- 🔄 WebSocket support (planned, not yet implemented)
- ✅ PostgreSQL with GORM
- ✅ CORS configured
- ✅ Rate limiting

### Database
- ✅ PostgreSQL in Docker
- ✅ Auto-migrations
- ✅ Persistent storage
- ✅ pgAdmin management tool

## 🔧 Development

### Prerequisites
- Docker Desktop
- Go 1.24+
- Node.js 18+
- Make (optional)

### Project Structure
```
discord-clone/
├── frontend/         # Next.js frontend
├── backend/         # Old Node.js backend (reference)
├── backend-go/      # New Go backend
├── docker/          # Docker configurations
└── docs/            # Documentation
```

### Common Commands

```bash
# Root level
make dev-all          # Start database
make setup           # First-time setup

# Backend
cd backend-go
make dev             # Run with hot-reload
make docker-up       # Start database
make migrate         # Run migrations
make test            # Run tests

# Frontend
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
```

## 🌐 Local URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Main application |
| Backend API | http://localhost:5000 | REST API |
| Database | localhost:5432 | PostgreSQL |
| pgAdmin | http://localhost:5050 | DB Management |

## 🔐 Environment Setup

### Backend
Create `backend-go/.env`:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=discord_clone
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Frontend
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## 🐳 Docker

The database runs in Docker for easy development:

```bash
# Start database
make db-start

# Stop database
make db-stop

# View logs
cd backend-go && make docker-logs
```

See [backend-go/DOCKER_SETUP.md](backend-go/DOCKER_SETUP.md) for Docker documentation.

## 🧪 Testing

### Backend Tests
```bash
cd backend-go
make test
```

### Manual Testing
1. Start all services
2. Open http://localhost:3000
3. Register a new account
4. Login and explore

## 📖 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Servers
- `GET /api/servers` - List servers
- `POST /api/servers` - Create server
- `GET /api/servers/:id` - Get server
- `PUT /api/servers/:id` - Update server
- `DELETE /api/servers/:id` - Delete server

### Channels
- `GET /api/channels/:id` - Get channel
- `POST /api/channels` - Create channel
- `PUT /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel

See [backend-go/README.md](backend-go/README.md) for complete API documentation.

## 🎯 Migration Status

This project was migrated from Node.js/TypeScript/Express to Go:

- ✅ Database migrated to PostgreSQL
- ✅ Backend rewritten in Go
- ✅ Docker setup configured
- ✅ Frontend adapted for new backend
- ✅ Real-time features working

See [agent.md](agent.md) for migration details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📝 License

MIT License - See LICENSE file for details

## 🆘 Need Help?

- Check [QUICKSTART.md](QUICKSTART.md) for setup issues
- See [LOCAL_DEV_SETUP.md](LOCAL_DEV_SETUP.md) for detailed guide
- Review [backend-go/DOCKER_SETUP.md](backend-go/DOCKER_SETUP.md) for Docker help

---

**Happy Coding! 🎉**
