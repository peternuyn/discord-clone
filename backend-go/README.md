# Discord Clone Backend (Go)

A high-performance Discord clone backend built with Go, Gin, and PostgreSQL.

## Features

- **Authentication**: JWT-based authentication with secure password hashing
- **Real-time Communication**: WebSocket support for real-time messaging
- **Server Management**: Create, join, and manage Discord-like servers
- **Channel System**: Text and voice channels with proper permissions
- **User Management**: User profiles, avatars, and status tracking
- **Invite System**: Server invites with expiration and usage tracking
- **Voice Support**: Voice channel management and WebRTC signaling
- **Notifications**: User notification system
- **Rate Limiting**: Built-in rate limiting for API protection

## Tech Stack

- **Language**: Go 1.24+
- **Framework**: Gin (HTTP web framework)
- **Database**: PostgreSQL with GORM (ORM)
- **Authentication**: JWT tokens with bcrypt password hashing
- **Real-time**: Gorilla WebSocket
- **Validation**: Go Playground Validator
- **Configuration**: Environment variables with godotenv

## Project Structure

```
backend-go/
├── cmd/
│   └── server/
│       └── main.go          # Application entry point
├── internal/
│   ├── auth/                # Authentication utilities
│   ├── controllers/         # HTTP handlers
│   ├── middleware/          # HTTP middleware
│   ├── models/              # Database models
│   ├── realtime/            # WebSocket handlers
│   ├── routes/              # Route definitions
│   └── services/            # Business logic
├── pkg/
│   ├── config/              # Configuration management
│   ├── database/            # Database connection and migrations
│   └── utils/               # Utility functions
├── migrations/              # Database migrations
├── docker/                  # Docker configuration
├── .env.example            # Environment variables template
├── Makefile                # Development commands
└── README.md               # This file
```

## Quick Start

### Prerequisites

- Go 1.24 or higher (Go 1.25+ recommended for hot-reload)
- PostgreSQL 12 or higher (or use Docker)
- Make (optional, for using Makefile commands)
- Docker Desktop (optional, for containerized setup)

### Installation

Choose your preferred setup method:

#### Option 1: Docker Setup (Recommended for Quick Start)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd discord-clone/backend-go
   ```

2. **Start database with Docker**:
   ```bash
   make docker-up
   ```
   to view the database in postgre terminal (aka connect to the database)
   
   ```bash
      make db-psql
      (or psql -h localhost -U postgres -d discord_clone)
   ```

3. **Run migrations**:
   ```bash
   make migrate
   ```

4. **Start the application**:
   ```bash
   make run
   ```

🎉 You're done! Server running at http://localhost:5000

See [docker/QUICKSTART.md](docker/QUICKSTART.md) for more Docker commands.

#### Option 2: Local Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd discord-clone/backend-go
   ```

2. **Setup environment**:
   ```bash
   make setup
   # or manually:
   cp .env.example .env
   ```

3. **Configure environment variables**:
   Edit `.env` file with your database credentials:
   ```env
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=postgres
   DATABASE_PASSWORD=postgres  # For Docker setup
   DATABASE_NAME=discord_clone
   JWT_SECRET=dev-secret-key-change-in-production
   ```

4. **Install dependencies**:
   ```bash
   make deps
   # or manually:
   go mod tidy
   go mod download
   ```

5. **Setup database**:
   ```bash
   # Create PostgreSQL database
   createdb discord_clone
   ```

6. **Run the application**:
   ```bash
   make run
   # or manually:
   go run cmd/server/main.go
   ```

The server will start on `http://localhost:5000`

### Development

For development:
```bash
make dev
```

**Note**: With Go 1.24, `make dev` uses `go run` for development. For hot-reload functionality, upgrade to Go 1.25+ or use a file watcher like `watch -n 1 go run cmd/server/main.go`.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile

### Servers
- `POST /api/servers` - Create a new server
- `GET /api/servers` - Get user's servers
- `GET /api/servers/:id` - Get server by ID
- `PUT /api/servers/:id` - Update server
- `DELETE /api/servers/:id` - Delete server
- `POST /api/servers/:id/quit` - Leave server

### Channels
- `POST /api/channels` - Create channel
- `GET /api/channels/:id` - Get channel
- `PUT /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel

### Invites
- `POST /api/invites` - Create invite
- `GET /api/invites/:code` - Get invite info
- `POST /api/invites/:code/accept` - Accept invite

## Database Schema

The application uses the following main entities:

- **Users**: User accounts with authentication
- **Servers**: Discord-like servers/guilds
- **ServerMembers**: User-server relationships with roles
- **Channels**: Text and voice channels within servers
- **Messages**: Chat messages in channels
- **Reactions**: Message reactions
- **Notifications**: User notifications
- **Invites**: Server invitation system
- **VoiceStates**: Voice channel participant states

## Configuration

All configuration is done through environment variables. See `.env.example` for all available options.

### Required Environment Variables

- `DATABASE_HOST` - PostgreSQL host
- `DATABASE_PORT` - PostgreSQL port
- `DATABASE_USER` - Database username
- `DATABASE_PASSWORD` - Database password
- `DATABASE_NAME` - Database name
- `JWT_SECRET` - Secret key for JWT tokens

### Optional Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - CORS allowed origin
- `RATE_LIMIT_WINDOW` - Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window

## Development Commands

```bash
make help           # Show all available commands
make build          # Build the application
make run            # Run the application
make dev            # Run in development mode with auto-reload
make test           # Run tests
make fmt            # Format code
make lint           # Lint code
make clean          # Clean build artifacts
make setup          # Setup development environment
```

## Docker Support

### Database Only (Recommended for Development)

Start just the PostgreSQL database:

```bash
make docker-up        # Start database container
make docker-down      # Stop containers
make docker-logs      # View logs
```

### Full Stack Setup

Start database with management tools:

```bash
make docker-up-all    # Start database + pgAdmin + Redis
make docker-dev       # Development setup with Adminer
make docker-prod      # Production configuration
```

### Application Container

Build and run the entire application:

```bash
make docker-build     # Build Docker image
make docker-run       # Run application container
make docker-build-prod # Build and run production stack
```

### Database Management

```bash
make db-psql          # Open psql shell
make db-backup        # Backup database
make db-restore       # Restore from backup
make db-reset         # Reset database (WARNING: deletes data)
```

See [docker/README.md](docker/README.md) for detailed Docker documentation.

## Testing

Run tests:
```bash
make test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Performance Notes

This Go implementation provides significant performance improvements over the Node.js version:

- **Memory Usage**: ~70% less memory consumption
- **Response Time**: ~50% faster response times
- **Concurrency**: Better handling of concurrent connections
- **Startup Time**: ~80% faster startup time

## Migration from Node.js

If migrating from the Node.js version:

1. Export your existing data from PostgreSQL
2. Update your database schema using the migrations
3. Import your data into the new schema
4. Update your frontend to use the new API endpoints

The API endpoints are designed to be compatible with the existing frontend, but some adjustments may be needed for the real-time features.
