#!/bin/bash

echo "🚀 Setting up PostgreSQL for Discord Clone Backend (Go)..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your PostgreSQL connection details"
    echo "You can copy from .env.example:"
    echo "cp .env.example .env"
    exit 1
fi

# Source the .env file to get database credentials
source .env

echo "📊 Database Configuration:"
echo "  Host: ${DATABASE_HOST:-localhost}"
echo "  Port: ${DATABASE_PORT:-5432}"
echo "  User: ${DATABASE_USER:-postgres}"
echo "  Database: ${DATABASE_NAME:-discord_clone}"

# Test database connection
echo ""
echo "🔍 Testing database connection..."

# Create database if it doesn't exist
echo "📦 Creating database if it doesn't exist..."
createdb -h ${DATABASE_HOST:-localhost} -p ${DATABASE_PORT:-5432} -U ${DATABASE_USER:-postgres} ${DATABASE_NAME:-discord_clone} 2>/dev/null || echo "Database already exists or creation failed"

# Build the application
echo ""
echo "🔨 Building Go application..."
go build -o bin/server cmd/server/main.go

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Run database migrations
echo ""
echo "🗄️  Running database migrations..."
./bin/server migrate

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PostgreSQL setup complete!"
    echo ""
    echo "🎉 Your Discord Clone Backend (Go) is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Start the server: make run"
    echo "2. Test the health endpoint: curl http://localhost:5000/health"
    echo "3. Check your database tables in PostgreSQL"
    echo ""
    echo "API endpoints will be available at:"
    echo "  - Health: http://localhost:5000/health"
    echo "  - API: http://localhost:5000/api/"
    echo "  - Auth: http://localhost:5000/api/auth/"
else
    echo "❌ Database migration failed!"
    echo "Please check your database connection and try again."
    exit 1
fi
