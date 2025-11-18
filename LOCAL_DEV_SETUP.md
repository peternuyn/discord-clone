# Local Development Setup Guide

Complete guide to run the Discord Clone frontend and backend locally.

## 🎯 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Go 1.24+ installed
- Node.js 18+ installed
- Make (optional)

### One-Command Setup (Recommended)

```bash
# From project root
make dev-all
```

This will start:
- ✅ PostgreSQL database in Docker
- ✅ Backend Go server on port 5000
- ✅ Frontend Next.js on port 3000

---

## 📋 Detailed Setup

### Step 1: Start Database

Open terminal 1:
```bash
cd backend-go
make docker-up
```

Wait for database to be ready:
```bash
make db-wait
```

Run migrations:
```bash
make migrate
```

✅ Database is now running on `localhost:5432`

### Step 2: Start Backend

Keep terminal 1 running, open terminal 2:
```bash
cd backend-go
make run
# or for auto-reload:
make dev
```

✅ Backend API running on `http://localhost:5000`
- Health check: http://localhost:5000/health

### Step 3: Start Frontend

Open terminal 3:
```bash
cd frontend
npm install  # first time only
npm run dev
```

✅ Frontend running on `http://localhost:3000`

---

## 🔧 Configuration

### Backend Configuration

Edit `backend-go/.env`:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=discord_clone

JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=5000
NODE_ENV=development

CORS_ORIGIN=http://localhost:3000
```

### Frontend Configuration

Create `frontend/.env.local`:
```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Socket.IO server (for real-time features)
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### Environment Variables Reference

#### Backend (.env)
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_HOST` | localhost | PostgreSQL host |
| `DATABASE_PORT` | 5432 | PostgreSQL port |
| `DATABASE_USER` | postgres | Database user |
| `DATABASE_PASSWORD` | postgres | Database password |
| `DATABASE_NAME` | discord_clone | Database name |
| `JWT_SECRET` | - | JWT signing secret (required) |
| `PORT` | 5000 | Backend server port |
| `CORS_ORIGIN` | http://localhost:3000 | Allowed frontend origin |

#### Frontend (.env.local)
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | http://localhost:5000/api | Backend API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | http://localhost:5000 | WebSocket server URL |

---

## 🚀 Development Workflow

### Daily Development

1. **Start everything**:
   ```bash
   # Terminal 1: Database
   cd backend-go && make docker-up
   
   # Terminal 2: Backend
   cd backend-go && make dev
   
   # Terminal 3: Frontend
   cd frontend && npm run dev
   ```

2. **Make changes**:
   - Backend: Auto-reloads with `make dev` (uses Air)
   - Frontend: Auto-reloads with Next.js

3. **Stop everything**:
   ```bash
   # Stop database
   cd backend-go && make docker-down
   
   # Stop backend: Ctrl+C in terminal 2
   # Stop frontend: Ctrl+C in terminal 3
   ```

### Testing the Setup

1. **Check database**:
   ```bash
   curl http://localhost:5000/health
   ```

2. **Test API**:
   ```bash
   # Health check
   curl http://localhost:5000/health
   
   # Should return: {"status":"OK","timestamp":"..."}
   ```

3. **Test frontend**:
   - Open http://localhost:3000
   - Should see login page
   - Try registering a new user

---

## 🗄️ Database Management

### Useful Commands

```bash
# View database logs
make docker-logs-db

# Access database shell
make db-psql

# Backup database
make db-backup

# Restore database
make db-restore

# Reset database (WARNING: deletes all data)
make db-reset
```

### Common SQL Commands

```sql
-- Connect via psql
psql -h localhost -p 5432 -U postgres -d discord_clone

-- List all tables
\dt

-- Describe a table
\d users

-- Show all users
SELECT * FROM users;

-- Count records
SELECT COUNT(*) FROM servers;
```

---

## 🔍 Troubleshooting

### Backend Won't Start

**Issue**: Database connection error
```bash
# Check if database is running
make db-status

# Wait for database to be ready
make db-wait

# Check database logs
make docker-logs-db
```

**Issue**: Port 5000 already in use
```bash
# Find what's using the port
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change PORT in .env
PORT=5001
```

### Frontend Won't Connect to Backend

**Issue**: CORS errors
```bash
# Check CORS_ORIGIN in backend-go/.env
CORS_ORIGIN=http://localhost:3000

# Restart backend
```

**Issue**: Connection refused
```bash
# Verify backend is running
curl http://localhost:5000/health

# Check .env.local in frontend
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Issue**: 401 Unauthorized
- Check if JWT_SECRET is set in backend `.env`
- Verify cookies are being sent (check browser DevTools → Network)
- Clear browser cookies and try again

**Issue**: 404 errors for `/socket.io/`
- This is **normal** - WebSocket support is not yet implemented
- The app works fine for REST API features (auth, servers, channels)
- Real-time features will be added in future updates

### Database Issues

**Issue**: Migrations fail
```bash
# Reset database
make db-reset

# Manually run migrations
make migrate
```

**Issue**: Port conflicts
```bash
# PostgreSQL (5432)
lsof -i :5432

# Redis (6380)
lsof -i :6380

# Kill or change ports in .env
```

---

## 📊 Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **Backend API** | http://localhost:5000 | JWT token |
| **API Health** | http://localhost:5000/health | - |
| **Database** | localhost:5432 | postgres/postgres |
| **pgAdmin** | http://localhost:5050 | admin@admin.com/admin |

### pgAdmin Access

1. Start with: `make docker-up-all`
2. Open: http://localhost:5050
3. Login: admin@admin.com / admin
4. Add server:
   - Name: Discord Clone
   - Host: postgres
   - Port: 5432
   - Username: postgres
   - Password: postgres

---

## 🎨 Development Features

### Auto-Reload

- **Backend**: Uses `air` for hot-reload
  ```bash
  make dev  # Auto-installs air if not present
  ```

- **Frontend**: Next.js built-in hot-reload
  ```bash
  npm run dev
  ```

### Debugging

**Backend logs**:
```bash
# View logs in real-time
make docker-logs

# Backend application logs appear in terminal
```

**Frontend debugging**:
- Open browser DevTools
- Check Console for errors
- Network tab for API calls
- Application tab for cookies

---

## 🔐 First Time Setup

### 1. Setup Backend

```bash
cd backend-go

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env  # or use your preferred editor

# Install Go dependencies
make deps

# Start database
make docker-up
make db-wait

# Run migrations
make migrate

# Start backend
make run
```

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
EOF

# Start frontend
npm run dev
```

### 3. Test Registration

1. Open http://localhost:3000
2. Click "Sign Up" or go to /register
3. Fill in the form:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
4. Submit and you should be logged in!

---

## 📝 Makefile Commands

Quick reference for backend-go Makefile:

```bash
make help              # Show all commands
make docker-up         # Start database
make docker-down       # Stop database
make docker-logs       # View logs
make db-wait           # Wait for database
make migrate           # Run migrations
make run               # Run backend
make dev               # Run with auto-reload
make test              # Run tests
make build             # Build binary
```

---

## 🌐 Network Architecture

```
Browser (localhost:3000)
    ↓
Next.js Frontend
    ↓ HTTP Requests (CORS enabled)
    ↓
Go Backend (localhost:5000)
    ↓
Socket.IO WebSocket
    ↓
PostgreSQL (localhost:5432, Docker)
```

### Important Notes

- Backend and Frontend run as separate processes
- Database runs in Docker container
- CORS configured to allow localhost:3000
- Cookies shared between frontend/backend via credentials: 'include'
- WebSocket connects to same backend on port 5000

---

## 🎯 Common Workflows

### Starting Fresh

```bash
# Clean slate
cd backend-go
make docker-down-volumes  # WARNING: deletes data
make docker-up
make migrate
make dev

# New terminal
cd frontend
npm run dev
```

### Making Changes

1. Edit code in your IDE
2. Backend auto-reloads (if using `make dev`)
3. Frontend auto-reloads
4. Test in browser

### Resetting After Errors

```bash
# Stop everything
make docker-down
# Ctrl+C in backend terminal
# Ctrl+C in frontend terminal

# Start again
make docker-up
make db-wait
cd backend-go && make dev
cd frontend && npm run dev
```

---

## ✅ Verification Checklist

- [ ] Docker Desktop is running
- [ ] `make docker-up` starts containers
- [ ] `make db-status` shows "accepting connections"
- [ ] `curl http://localhost:5000/health` returns OK
- [ ] `npm run dev` starts frontend without errors
- [ ] http://localhost:3000 shows login page
- [ ] Can register a new user
- [ ] Can login with credentials
- [ ] Dashboard loads after login

---

## 🆘 Need Help?

- **Backend issues**: Check `backend-go/DOCKER_SETUP.md`
- **Database issues**: Check `backend-go/docker/README.md`
- **Frontend issues**: Check `frontend/README.md`
- **General**: Check `agent.md` for migration overview

---

**Happy Coding! 🎉**
