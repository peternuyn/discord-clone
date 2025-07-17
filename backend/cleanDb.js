import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clean() {
  console.log('Cleaning database...');

  // Delete in dependency-safe order (from leaf to root)
  await prisma.reaction.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.channel.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.invite.deleteMany({});
  await prisma.serverMember.deleteMany({});
  await prisma.server.deleteMany({});



  console.log('✅ Database cleaned');
  await prisma.$disconnect();
}

clean().catch((err) => {
  console.error('❌ Failed to clean DB:', err);
  prisma.$disconnect();
  process.exit(1);
});
