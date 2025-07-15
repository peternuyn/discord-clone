#!/bin/bash

echo "🚀 Setting up PostgreSQL migration..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your Supabase PostgreSQL connection string"
    exit 1
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "🗄️  Pushing schema to PostgreSQL database..."
npx prisma db push

echo "✅ PostgreSQL setup complete!"
echo ""
echo "🎉 Your Discord clone is now using PostgreSQL!"
echo ""
echo "Next steps:"
echo "1. Test your application: npm run dev"
echo "2. Check your database in Supabase dashboard"
echo "3. Consider adding real-time features with Supabase client" 

