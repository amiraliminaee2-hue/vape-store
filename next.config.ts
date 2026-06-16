import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["utfs.io", "uploadthing.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
    ],
  },
  // ✅ جلوگیری از اجرای Prisma در build
  output: 'standalone',
  // ✅ متغیرهای محیطی برای runtime
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
};

export default nextConfig;