import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ اتصال به دیتابیس موفق بود!');
    
    // یک کوئری ساده برای تست
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ نتیجه کوئری:', result);
    
  } catch (error) {
    console.error('❌ خطا در اتصال:', error.message);
    console.error('❌ جزئیات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();