import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// لیست فایل‌هایی که باید اصلاح بشن
const filesToFix = [
  'app/admin/categories/page.tsx',
  'app/admin/coupons/reports/page.tsx',
  'app/admin/customers/page.tsx',
  'app/admin/orders/page.tsx',
  'app/admin/page.tsx',
  'app/page.tsx',
  'app/product/[slug]/page.tsx',
  'app/[slug]/page.tsx',
  'app/sitemap.ts',
  'app/banned/page.tsx',
  'app/dashboard/notifications/page.tsx',
  'app/dashboard/orders/page.tsx',
  'app/payment/[id]/error/page.tsx',
  'app/payment/[id]/success/page.tsx',
  'app/api/account/orders/route.ts',
  'app/api/account/orders/[id]/route.ts',
  'app/api/account/[id]/route.ts',
  'app/api/admin/comments/route.ts',
  'app/api/admin/comments/[id]/route.ts',
  'app/api/admin/orders/[id]/status/route.ts',
  'app/api/admin/payment-methods/route.ts',
  'app/api/admin/products/discount/route.ts',
  'app/api/admin/products/import/route.ts',
  'app/api/admin/products/slider/route.ts',
  'app/api/admin/reports/export/route.ts',
  'app/api/admin/reports/route.ts',
  'app/api/admin/sellers/route.ts',
  'app/api/admin/settings/route.ts',
  'app/api/admin/shipping-methods/province-price/route.ts',
  'app/api/admin/shipping-methods/route.ts',
  'app/api/admin/users/route.ts',
  'app/api/admin/users/[id]/ban/route.ts',
  'app/api/auth/otp/send/route.ts',
  'app/api/auth/otp/verify/route.ts',
  'app/api/auth/signup/route.ts',
  'app/api/ban-status/route.ts',
  'app/api/cart/route.ts',
  'app/api/cart/[productId]/route.ts',
  'app/api/categories/route.ts',
  'app/api/comments/route.ts',
  'app/api/comments/[id]/route.ts',
  'app/api/coupons/route.ts',
  'app/api/create-admin/route.ts',
  'app/api/orders/route.ts',
  'app/api/orders/[id]/invoice/route.tsx',
  'app/api/orders/[id]/route.ts',
  'app/api/pages/route.ts',
  'app/api/payment/request/route.ts',
  'app/api/payment/verify/route.ts',
  'app/api/products/route.ts',
  'app/api/products/[productId]/route.ts',
  'app/api/profile/addresses/route.ts',
  'app/api/profile/addresses/[id]/route.ts',
  'app/api/profile/route.ts',
  'app/api/sellers/route.ts',
  'app/api/settings/route.ts',
  'app/api/shipping/calculate/route.ts',
  'app/api/user/ban-status/route.ts',
  'app/api/wishlist/route.ts',
  'app/api/wishlist/[productId]/route.ts',
  'lib/auth.ts',
  'lib/isAdmin.ts',
];

filesToFix.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // جایگزینی import prisma با getPrisma
    if (content.includes('import { prisma } from "@/lib/prisma"')) {
      content = content.replace(
        /import\s*{\s*prisma\s*}\s*from\s*["']@\/lib\/prisma["']/g,
        'import { getPrisma } from "@/lib/prisma"'
      );
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${file}`);
    } else {
      console.log(`⏭️ Skipped: ${file}`);
    }
  } else {
    console.log(`⚠️ File not found: ${file}`);
  }
});

console.log('🎉 Done!');