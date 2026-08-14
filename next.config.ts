import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ standalone برای PaaS مثل پارس‌پک
  output: "standalone",

  // ✅ قرار دادن Prisma Client در standalone bundle
  outputFileTracingIncludes: {
    "/*": ["node_modules/.prisma/client/**/*"],
  },

  // ✅ تنظیمات تصاویر
  images: {
    // ✅ جلوگیری از استفاده از /_next/image
    // تصاویر UploadThing مستقیماً از utfs.io لود می‌شوند
    unoptimized: true,

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

  // ✅ Turbopack
  turbopack: {},
};

export default nextConfig;