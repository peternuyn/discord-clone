# Discord Clone Backend (Go)

This service powers the Discord Clone API (authentication, servers, channels, messaging). It is written in Go with Gin + GORM and expects a PostgreSQL database.

## Prerequisites

- Go 1.22+ (IDE auto-run uses `go run`)
- Docker + Docker Compose (for the local Postgres stack)
- `make`

## Quick Start

```bash
cd backend-go
cp .env.example .env   # or create `.env` manually
make docker-up         # start postgres (port 5432)
make migrate           # applies GORM migrations
make run               # launches the API on :5000
```

Health check: `curl http://localhost:5000/health`

## Common Tasks

| Command | Description |
| --- | --- |
| `make docker-up` | start database container only |
| `make docker-up-all` | DB + pgAdmin + Redis |
| `make migrate` | run db migrations |
| `make run` | run server locally |
| `make dev` | same as `run` (placeholder for hot-reload) |
| `make db-psql` | open `psql` inside the container |
| `make db-backup` / `db-restore` | dump / restore `discord_clone` |
| `make docker-down` | stop containers |
| `make docker-down-volumes` | stop and delete DB volumes |

## Environment Variables

Minimal `.env`:

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=discord_clone
DATABASE_SSL_MODE=disable
JWT_SECRET=dev-secret-key-change-in-production
CORS_ORIGIN=http://localhost:3000
```

## API

Base URL: `http://localhost:5000/api`

- `POST /auth/register` – create account
- `POST /auth/login` – set `token` cookie (HTTP-only JWT)
- `GET /servers` / `POST /servers` – list/create servers
- `POST /servers/:id/quit`, `PUT /servers/:id`, etc.
- `POST /channels` – create channel (not fully implemented)

The Gin router does **not** auto redirect for trailing slashes, so `/api/servers` (without `/`) is the canonical path.

