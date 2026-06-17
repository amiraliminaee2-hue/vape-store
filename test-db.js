import { PrismaClient } from '@prisma/client';

// تنظیم مستقیم در محیط
process.env.DATABASE_URL = "postgresql://admin:Q_CDjdMM1AV0tYzt3QOP@app-postgresql-8qvo9.apps.teh2.abrhapaas.com:31454/padbushehr?sslmode=require";

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ اتصال موفق!');
  } catch (error) {
    console.error('❌ خطا:', error.message);
  }
}

main();