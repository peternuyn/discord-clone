.PHONY: help dev-all backend-frontend backend-start frontend-start db-start db-stop

help: ## Show this help message
	@echo "Discord Clone - Development Commands"
	@echo ""
	@echo "Quick Start:"
	@echo "  make dev-all      Start everything (database + backend + frontend)"
	@echo ""
	@echo "Individual Services:"
	@echo "  make db-start     Start database"
	@echo "  make db-stop      Stop database"
	@echo "  make backend      Start backend in dev mode"
	@echo "  make frontend     Start frontend in dev mode"
	@echo ""
	@echo "Full Commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Start everything (database + backend + frontend)
dev-all: ## Start all services for development
	@echo "🚀 Starting Discord Clone development environment..."
	@echo ""
	@echo "📦 Step 1: Starting database..."
	@cd backend-go && $(MAKE) docker-up
	@cd backend-go && $(MAKE) db-wait
	@echo "✅ Database is ready!"
	@echo ""
	@echo "🔄 Step 2: Running migrations..."
	@cd backend-go && $(MAKE) migrate
	@echo "✅ Migrations complete!"
	@echo ""
	@echo "✅ Development environment ready!"
	@echo ""
	@echo "📝 Next steps (run in separate terminals):"
	@echo "  Terminal 2: cd backend-go && make dev"
	@echo "  Terminal 3: cd frontend && npm run dev"
	@echo ""
	@echo "Then open http://localhost:3000 in your browser"

# Start database
db-start: ## Start PostgreSQL database
	@cd backend-go && $(MAKE) docker-up

# Stop database
db-stop: ## Stop PostgreSQL database
	@cd backend-go && $(MAKE) docker-down

# Start backend (for use in separate terminal)
backend: ## Start backend in development mode
	@cd backend-go && $(MAKE) dev

# Start frontend (for use in separate terminal)
frontend: ## Start frontend in development mode
	@cd frontend && npm run dev

# Setup everything for first time
setup: ## Setup development environment for first time
	@echo "🔧 Setting up Discord Clone development environment..."
	@echo ""
	@echo "📦 Backend setup..."
	@cd backend-go && $(MAKE) setup
	@echo ""
	@echo "📦 Frontend setup..."
	@cd frontend && npm install
	@echo ""
	@echo "✅ Setup complete! Run 'make dev-all' to start services"

# Clean everything
clean: ## Stop all services and clean artifacts
	@echo "🧹 Cleaning up..."
	@cd backend-go && $(MAKE) docker-down
	@echo "✅ Cleanup complete"
