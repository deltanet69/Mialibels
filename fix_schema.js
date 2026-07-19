require('dotenv').config({path: '.env'});
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE spp_invoices ADD COLUMN IF NOT EXISTS note TEXT;');
  console.log('Column added successfully');
}
main().catch(console.error).finally(()=>prisma.$disconnect());
