import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`
    console.log('✅ اتصال به دیتابیس موفق:', result)
  } catch (error) {
    console.error('❌ خطا در اتصال:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()