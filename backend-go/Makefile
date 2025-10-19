# Makefile for Discord Clone Backend (Go)

.PHONY: help build run dev test clean deps migrate

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
	@if command -v air >/dev/null 2>&1; then \
		air; \
	else \
		echo "Air not found. Installing air..." && \
		go install github.com/cosmtrek/air@latest && \
		air; \
	fi

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

# Run database migrations
migrate: ## Run database migrations
	@echo "Running database migrations..."
	go run cmd/server/main.go migrate

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
	docker build -t discord-clone-backend .

docker-run: ## Run Docker container
	@echo "Running Docker container..."
	docker run -p 5000:5000 --env-file .env discord-clone-backend

# Database commands
db-reset: ## Reset database (WARNING: This will delete all data)
	@echo "WARNING: This will delete all data in the database!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@echo "Resetting database..."
	# Add database reset commands here

# Development shortcuts
dev-setup: setup deps ## Setup development environment and install dependencies
start: run ## Alias for run
