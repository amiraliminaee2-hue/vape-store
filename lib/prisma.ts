import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ✅ تنظیم DATABASE_URL در محیط اجرا
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/vape_store";

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL is not set. Setting fallback for build.");
  process.env.DATABASE_URL = databaseUrl;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function getPrisma() {
  if (!prisma) {
    throw new Error("PrismaClient is not initialized.");
  }
  return prisma;
}