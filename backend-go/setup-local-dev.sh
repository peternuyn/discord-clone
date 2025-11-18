#!/bin/bash

# Setup script for local development
# This ensures database and backend configuration match

set -e

echo "🔧 Setting up local development environment..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

# Update .env to match Docker configuration
echo ""
echo "🔧 Updating .env to match Docker configuration..."

# Update database password to match docker-compose
sed -i 's/DATABASE_PASSWORD=.*/DATABASE_PASSWORD=postgres/' .env

# Ensure Docker database credentials match
echo ""
echo "📊 Database Configuration:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  User: postgres"
echo "  Password: postgres"
echo "  Database: discord_clone"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo ""
    echo "⚠️  Docker is not running!"
    echo "Please start Docker Desktop and run this script again."
    exit 1
fi

echo ""
echo "🚀 Starting Docker database..."
cd docker && docker-compose up -d postgres && cd ..

echo ""
echo "⏳ Waiting for database to be ready..."
sleep 3

# Wait for database
until docker exec discord-clone-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ Database is ready!"
echo ""
echo "🔄 Running migrations..."
go run cmd/server/main.go 2>&1 | head -20

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Start backend:  make dev"
echo "  2. Start frontend: cd frontend && npm run dev"
echo "  3. Open http://localhost:3000"
echo ""
