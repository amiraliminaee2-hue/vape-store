import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
  // ✅ فعال کردن Turbopack بدون webpack config
  turbopack: {},
};

export default nextConfig;