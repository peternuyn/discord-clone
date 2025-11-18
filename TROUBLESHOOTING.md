# Troubleshooting Guide

## Common Errors and Solutions

### 404 Errors on API Endpoints

**Error:** `GET http://localhost:5000/api/servers 404 (Not Found)`

**Solution:** The backend needs to be restarted after code changes.

```bash
# In your backend terminal:
# 1. Press Ctrl+C to stop the server
# 2. Run:
cd backend-go && make dev
```

### 401 Unauthorized Errors

**Error:** `GET http://localhost:5000/api/auth/me 401 (Unauthorized)`

**Causes:**
1. Not logged in yet
2. Cookie expired
3. Browser blocked cookie

**Solution:** 
1. Go to http://localhost:3000/login or /register
2. Log in again
3. Check browser DevTools → Application → Cookies

### 307/404 Redirect Errors on POST

**Error:** `POST http://localhost:5000/api/servers net::ERR_FAILED 307`

**Solution:** Backend has been fixed, just needs restart:

```bash
# Stop backend: Ctrl+C
# Restart: cd backend-go && make dev
```

### Socket.IO Connection Failed

**Error:** `WebSocket connection to 'ws://localhost:5000/socket.io/' failed`

**This is normal!** WebSocket support is not yet implemented in the Go backend. The app will work fine for all REST API features.

### Database Connection Failed

**Error:** `failed to connect to database: connection refused`

**Solution:**
```bash
# Check if database is running
cd backend-go && make docker-up

# Wait for database to be ready
make db-wait

# Restart backend
make dev
```

### Port Already in Use

**Error:** `bind: address already in use`

**Solution:**
```bash
# Find the process using the port
lsof -i :5000

# Kill it
kill -9 <PID>

# Or use a different port in .env
PORT=5001
```

### JSON Parse Errors

**Error:** `SyntaxError: Unexpected non-whitespace character after JSON`

**Solution:** Backend returned HTML instead of JSON. Usually means:
1. Backend crashed → Check backend logs
2. Backend not running → Restart backend
3. Wrong port → Check backend is on port 5000

## Quick Diagnostic

Run this to check everything:

```bash
# Check database
curl http://localhost:5000/health

# Should return: {"status":"OK","timestamp":{}}

# Check if backend is running
curl http://localhost:5000/api/auth/login -X POST -d '{}'

# Should return validation error (which means backend is working)
```

## Still Having Issues?

1. **Restart everything:**
   ```bash
   # Stop all services
   cd backend-go && make docker-down
   
   # Start fresh
   make docker-up
   make db-wait
   make dev
   ```

2. **Check logs:**
   ```bash
   # Backend logs (in backend terminal)
   # Database logs
   cd backend-go && make docker-logs-db
   ```

3. **Verify environment:**
   ```bash
   # Backend
   cd backend-go && cat .env
   
   # Frontend  
   cd frontend && cat .env.local
   ```

## Getting Fresh Start

Complete reset (⚠️ deletes all data):

```bash
# Stop everything
cd backend-go && make docker-down-volumes

# Start fresh
make docker-up
make db-wait
make migrate
make dev

# In another terminal
cd frontend && npm run dev
```

Then go to http://localhost:3000 and register a new account!

