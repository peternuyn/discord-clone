# Quick Start Guide - Docker Setup

Get your Discord Clone backend running with Docker in minutes!

## Prerequisites

- Docker Desktop installed and running
- Docker Compose v2 or higher

## Quick Start

### 1. Start the Database

```bash
# From the backend-go directory
make docker-up
```

This starts PostgreSQL on port 5432.

### 2. Run Migrations

```bash
make migrate
```

This creates all necessary database tables.

### 3. Start Your Application

```bash
make run
```

Your server is now running at http://localhost:5000!

## Common Commands

| Command | Description |
|---------|-------------|
| `make docker-up` | Start database container |
| `make docker-down` | Stop containers |
| `make docker-logs` | View logs |
| `make migrate` | Run database migrations |
| `make run` | Start the Go application |
| `make dev` | Start with auto-reload |

## Full Stack (Optional)

To start all services including pgAdmin for database management:

```bash
make docker-up-all
```

Then access pgAdmin at http://localhost:5050

## Troubleshooting

### Port conflicts?

**PostgreSQL (5432) in use:**
```bash
# On macOS
brew services stop postgresql

# On Linux
sudo systemctl stop postgresql

# Or use a different port
# Edit docker/docker-compose.yml and change DATABASE_PORT
```

**Redis (6379) in use:**
```bash
# Default Redis port changed to 6380 in docker-compose.yml
# If 6380 is also in use, change REDIS_PORT in .env
REDIS_PORT=6381
```

### Database not connecting?

Wait for the database to be ready:
```bash
make db-wait
```

Then try again.

### Reset everything?

```bash
make docker-down-volumes
make docker-up
make migrate
```

## Next Steps

1. **Test the API**: `curl http://localhost:5000/health`
2. **Register a user**: `curl -X POST http://localhost:5000/api/auth/register`
3. **View database**: Access pgAdmin at http://localhost:5050

## Configuration

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your settings.

## Need Help?

See [docker/README.md](README.md) for detailed documentation.
