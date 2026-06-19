import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ✅ در Prisma 7.x گزینه datasources حذف شده
// DATABASE_URL باید در .env یا environment variables سرور تنظیم شده باشد
// Prisma 7 به صورت خودکار از متغیر محیطی DATABASE_URL استفاده می‌کند
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ✅ تابع برای استفاده در API routes
export async function getPrisma() {
  if (!prisma) {
    throw new Error("PrismaClient is not initialized.");
  }
  return prisma;
}