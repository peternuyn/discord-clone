import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful!', result);
    
    // Test if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    console.log('📋 Available tables:', tables);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes('Tenant or user not found')) {
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Check if your Supabase project is paused');
      console.log('2. Verify your connection strings in .env');
      console.log('3. Make sure your Supabase project still exists');
      console.log('4. Check if you need to reset your database password');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

