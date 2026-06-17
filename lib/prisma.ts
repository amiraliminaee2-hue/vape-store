import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ✅ فقط در صورت وجود DATABASE_URL، PrismaClient بساز
export const prisma = (() => {
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL is not set. PrismaClient will not work.");
    return null;
  }
  
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  
  return globalForPrisma.prisma;
})();

// ✅ تابع برای استفاده در API routes
export async function getPrisma() {
  if (!prisma) {
    throw new Error("PrismaClient is not initialized. Please check DATABASE_URL.");
  }
  return prisma;
}