# PostgreSQL Migration Guide

## Step 1: Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > Database to get your connection string

## Step 2: Update Environment Variables

Replace your `backend/.env` file with:

```env
# Replace with your Supabase PostgreSQL connection string
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=5000
NODE_ENV="development"
```

## Step 3: Generate and Run Migrations

```bash
cd backend
npx prisma generate
npx prisma db push
```

## Step 4: Test Your Application

```bash
npm run dev
```

## Benefits You'll Get:

✅ **Better concurrency** - Multiple users can write simultaneously  
✅ **Real-time features** - Supabase provides real-time subscriptions  
✅ **Better scalability** - PostgreSQL handles more data and users  
✅ **Built-in monitoring** - Supabase dashboard for database stats  
✅ **Advanced features** - JSON fields, full-text search, better indexing  

## Next Steps (Optional):

1. **Add real-time features** using Supabase client
2. **Use Supabase Auth** instead of custom JWT
3. **Add Row Level Security** for better data protection
4. **Use Supabase Storage** for file uploads 