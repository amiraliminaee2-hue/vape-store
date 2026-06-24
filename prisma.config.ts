// این فایل برای Prisma 6.18+ لازم است و پروژه را برای آینده آماده می‌کند.
// با وجود این فایل، Prisma CLI از schema.prisma برای url استفاده نمی‌کند
// و خطای deprecation نمی‌دهد.

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
});