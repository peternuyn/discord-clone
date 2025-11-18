# Quick Start Guide

Get your Discord Clone running in 3 minutes!

## Prerequisites

- Docker Desktop installed and running
- Go 1.24+ installed
- Node.js 18+ installed

## One-Command Setup

From the project root:

```bash
make dev-all
```

Then open **3 terminals** and run:

**Terminal 1** (already done by `make dev-all` - database is running):
```bash
# Database should already be running
```

**Terminal 2** (Backend):
```bash
cd backend-go
make dev
```

**Terminal 3** (Frontend):
```bash
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser! 🎉

---

## What Just Happened?

✅ PostgreSQL database started in Docker  
✅ Database migrations ran automatically  
✅ Backend Go server running on port 5000  
✅ Frontend Next.js running on port 3000  
✅ CORS configured between frontend and backend  

---

## First Time Setup

If you haven't run this before:

### 1. Backend Setup
```bash
cd backend-go

# Copy environment file
cp .env.example .env

# Edit .env (optional, defaults work fine for local dev)
nano .env

# Install dependencies
make deps
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies (only needed once)
npm install

# Environment already configured in .env.local
```

### 3. Start Everything
```bash
# From project root
make dev-all

# Then in separate terminals:
cd backend-go && make dev
cd frontend && npm run dev
```

---

## Test It Works

1. **Check database**: `curl http://localhost:5000/health`
2. **Open frontend**: http://localhost:3000
3. **Register a user**: Click "Sign Up" and create an account
4. **Login**: Use your credentials

---

## Quick Commands

```bash
# Start database
make db-start

# Stop database
make db-stop

# View backend logs
cd backend-go && make docker-logs

# Reset database (clears all data)
cd backend-go && make db-reset
```

---

## Troubleshooting

### Backend won't start
```bash
# Check if database is running
cd backend-go && make db-status

# Wait for database
cd backend-go && make db-wait
```

### Frontend can't connect to backend
- Make sure backend is running: `curl http://localhost:5000/health`
- Check `frontend/.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:5000/api`

### Port already in use
```bash
# PostgreSQL
lsof -i :5432

# Backend
lsof -i :5000

# Frontend
lsof -i :3000
```

---

## What's Running?

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:3000 | Next.js |
| Backend API | http://localhost:5000 | Go/Gin |
| Database | localhost:5432 | PostgreSQL |
| pgAdmin | http://localhost:5050 | (optional) |

---

## Next Steps

- Read [LOCAL_DEV_SETUP.md](LOCAL_DEV_SETUP.md) for detailed info
- Check [backend-go/DOCKER_SETUP.md](backend-go/DOCKER_SETUP.md) for database setup
- See [agent.md](agent.md) for migration overview

---

**Need help?** Check the full documentation in `LOCAL_DEV_SETUP.md`
