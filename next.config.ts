import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ standalone برای PaaS مثل پارس‌پک ضروری است
  output: "standalone",

  // ✅ Prisma client files را در standalone bundle قرار می‌دهد
  outputFileTracingIncludes: {
    "/*": ["node_modules/.prisma/client/**/*"],
  },

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

  // ✅ Turbopack برای build سریع‌تر
  turbopack: {},
};

export default nextConfig;