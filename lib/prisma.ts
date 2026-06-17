import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ✅ همیشه یک PrismaClient بساز، حتی اگر DATABASE_URL وجود نداشته باشد
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