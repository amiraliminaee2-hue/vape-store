
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env["DATABASE_URL"];

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

// ایجاد Prisma فقط هنگام اولین استفاده
export async function getPrisma(): Promise<PrismaClient> {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}
