import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check if superadmin already exists
  const existingSuperadmin = await prisma.user.findFirst({
    where: {
      email: 'superadmin@miattaqwa15.sch.id',
    },
  });

  if (!existingSuperadmin) {
    const superadmin = await prisma.user.create({
      data: {
        email: 'superadmin@miattaqwa15.sch.id',
        name: 'Super Administrator',
        role: 'SUPERADMIN',
      },
    });
    console.log('✅ Superadmin created:', superadmin);
  } else {
    console.log('ℹ️ Superadmin already exists:', existingSuperadmin);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
