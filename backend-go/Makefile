# Makefile for Discord Clone Backend (Go)

.PHONY: help build run dev test clean deps migrate docker-up docker-down docker-logs db-backup db-restore db db-psql

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Build the application
build: ## Build the application
	@echo "Building application..."
	go build -o bin/server cmd/server/main.go
	@echo "Build complete!"

# Run the application
run: ## Run the application
	@echo "Starting server..."
	go run cmd/server/main.go

# Run in development mode with auto-reload
dev: ## Run in development mode with auto-reload
	@echo "Starting development server..."
	@echo "Using 'go run' for development (hot-reload not available with Go 1.24)"
	@echo "For hot-reload, upgrade to Go 1.25+ or use: watch -n 1 go run cmd/server/main.go"
	@go run cmd/server/main.go

# Run tests
test: ## Run tests
	@echo "Running tests..."
	go test ./...

# Clean build artifacts
clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	rm -rf bin/
	go clean

# Install dependencies
deps: ## Install dependencies
	@echo "Installing dependencies..."
	go mod tidy
	go mod download

# Run database migrations using golang-migrate
migrate: ## Run database migrations (requires migrate CLI: https://github.com/golang-migrate/migrate)
	@echo "Running database migrations..."
	@if ! command -v migrate >/dev/null 2>&1 && [ ! -f "$(HOME)/go/bin/migrate" ]; then \
		echo "Error: migrate CLI not found. Install with: go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest"; \
		echo "Then add $HOME/go/bin to your PATH"; \
		exit 1; \
	fi
	@read -p "Enter database URL (postgres://user:pass@host:port/dbname) or press Enter for default: " dburl; \
	if [ -z "$$dburl" ]; then \
		dburl="postgres://$${DATABASE_USER:-postgres}:$${DATABASE_PASSWORD:-postgres}@$${DATABASE_HOST:-localhost}:$${DATABASE_PORT:-5432}/$${DATABASE_NAME:-discord_clone}?sslmode=$${DATABASE_SSL_MODE:-disable}"; \
	fi; \
	PATH="$$PATH:$$HOME/go/bin" migrate -path migrations -database "$$dburl" up

migrate-down: ## Rollback last migration
	@if ! command -v migrate >/dev/null 2>&1 && [ ! -f "$(HOME)/go/bin/migrate" ]; then \
		echo "Error: migrate CLI not found. Install with: go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest"; \
		echo "Then add $HOME/go/bin to your PATH"; \
		exit 1; \
	fi
	@read -p "Enter database URL (postgres://user:pass@host:port/dbname) or press Enter for default: " dburl; \
	if [ -z "$$dburl" ]; then \
		dburl="postgres://$${DATABASE_USER:-postgres}:$${DATABASE_PASSWORD:-postgres}@$${DATABASE_HOST:-localhost}:$${DATABASE_PORT:-5432}/$${DATABASE_NAME:-discord_clone}?sslmode=$${DATABASE_SSL_MODE:-disable}"; \
	fi; \
	PATH="$$PATH:$$HOME/go/bin" migrate -path migrations -database "$$dburl" down 1

# Generate sqlc code
sqlc-generate: ## Generate sqlc code from SQL queries
	@echo "Generating sqlc code..."
	@if ! command -v sqlc >/dev/null 2>&1 && [ ! -f "$(HOME)/go/bin/sqlc" ]; then \
		echo "Error: sqlc not found. Install with: go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest"; \
		echo "Then add $HOME/go/bin to your PATH"; \
		exit 1; \
	fi
	@PATH="$$PATH:$$HOME/go/bin" sqlc generate

# Format code
fmt: ## Format code
	@echo "Formatting code..."
	go fmt ./...

# Lint code
lint: ## Lint code
	@echo "Linting code..."
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run; \
	else \
		echo "golangci-lint not found. Installing..." && \
		go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest && \
		golangci-lint run; \
	fi

# Setup development environment
setup: ## Setup development environment
	@echo "Setting up development environment..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env file from .env.example"; \
	fi
	go mod tidy
	go mod download
	@echo "Setup complete! Please update your .env file with your database credentials."

# Docker commands
docker-build: ## Build Docker image
	@echo "Building Docker image..."
	docker build -t discord-clone-backend:latest -f docker/Dockerfile .

docker-run: ## Run Docker container
	@echo "Running Docker container..."
	docker run -p 5000:5000 --env-file .env discord-clone-backend:latest

docker-up: ## Start Docker containers (database only)
	@echo "Starting Docker containers..."
	@cd docker && docker-compose up -d

docker-up-all: ## Start all Docker containers (database, pgadmin, redis)
	@echo "Starting all Docker containers..."
	@cd docker && docker-compose up -d

docker-down: ## Stop Docker containers
	@echo "Stopping Docker containers..."
	@cd docker && docker-compose down

docker-down-volumes: ## Stop Docker containers and remove volumes (WARNING: deletes data)
	@echo "WARNING: This will delete all data in the database!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@cd docker && docker-compose down -v

docker-logs: ## View Docker container logs
	@cd docker && docker-compose logs -f

docker-logs-db: ## View PostgreSQL logs
	@cd docker && docker-compose logs -f postgres

docker-restart: docker-down docker-up ## Restart Docker containers

docker-dev: ## Start Docker containers for development
	@cd docker && docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

docker-prod: ## Start Docker containers for production
	@cd docker && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

docker-build-prod: ## Build and run production stack
	@echo "Building production Docker image..."
	@cd docker && docker-compose -f docker-compose.yml -f docker-compose.prod.yml build app
	@echo "Starting production services..."
	@cd docker && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Database commands
db-reset: ## Reset database (WARNING: This will delete all data)
	@echo "WARNING: This will delete all data in the database!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@cd docker && docker-compose down -v
	@cd docker && docker-compose up -d postgres
	@sleep 5
	@$(MAKE) migrate

db-backup: ## Backup database to backup.sql
	@echo "Backing up database..."
	@docker exec discord-clone-postgres pg_dump -U postgres discord_clone > backup.sql
	@echo "Backup saved to backup.sql"

db-restore: ## Restore database from backup.sql
	@echo "WARNING: This will overwrite the current database!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@docker exec -i discord-clone-postgres psql -U postgres discord_clone < backup.sql
	@echo "Database restored from backup.sql"

db: ## Open pgcli shell
	@PGPASSWORD=$${DATABASE_PASSWORD:-postgres} pgcli -h localhost -U postgres -d discord_clone

db-psql: ## Open psql shell (legacy)
	@docker exec -it discord-clone-postgres psql -U postgres -d discord_clone

db-status: ## Check database status
	@docker exec discord-clone-postgres pg_isready -U postgres

db-wait: ## Wait for database to be ready
	@echo "Waiting for database to be ready..."
	@until docker exec discord-clone-postgres pg_isready -U postgres > /dev/null 2>&1; do \
		echo "Waiting for PostgreSQL..."; \
		sleep 2; \
	done
	@echo "Database is ready!"

# Development shortcuts
dev-setup: setup deps ## Setup development environment and install dependencies
start: run ## Alias for run
