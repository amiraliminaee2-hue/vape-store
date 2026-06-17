import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// لیست فایل‌هایی که باید اصلاح بشن
const filesToFix = [
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
  'components/layout/Footer.tsx',
  'lib/auth.ts',
  'lib/isAdmin.ts',
  'prisma/seed.ts',
];

function fixFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;

    // 1. جایگزینی import prisma با getPrisma
    if (content.includes('import { prisma } from "@/lib/prisma"')) {
      content = content.replace(
        /import\s*{\s*prisma\s*}\s*from\s*["']@\/lib\/prisma["']/g,
        'import { getPrisma } from "@/lib/prisma"'
      );
      changed = true;
      console.log(`✅ Fixed import in: ${filePath}`);
    }

    // 2. اضافه کردن const prisma = await getPrisma(); در توابع async
    // این کار با regex انجام میشه
    const functionRegex = /(export\s+async\s+function\s+\w+\s*\([^)]*\)\s*\{)/g;
    let match;
    let newContent = content;
    let hasPrismaCall = false;

    // بررسی اینکه آیا قبلاً getPrisma استفاده شده
    if (content.includes('await getPrisma()')) {
      hasPrismaCall = true;
    }

    // اگر import changed شده ولی getPrisma استفاده نشده
    if (changed && !hasPrismaCall) {
      // پیدا کردن توابع async و اضافه کردن getPrisma
      const lines = content.split('\n');
      let inAsyncFunction = false;
      let functionIndent = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // تشخیص شروع تابع async
        if (line.match(/export\s+async\s+function\s+\w+\s*\([^)]*\)\s*\{/)) {
          inAsyncFunction = true;
          functionIndent = line.match(/^\s*/)[0].length + 2;
          
          // چک کردن خطوط بعدی تا جای مناسب برای اضافه کردن
          let nextLine = lines[i + 1] || '';
          if (!nextLine.includes('await getPrisma()') && !nextLine.includes('const prisma')) {
            // اضافه کردن در خط بعدی
            const indent = ' '.repeat(functionIndent);
            lines.splice(i + 1, 0, `${indent}const prisma = await getPrisma();`);
            changed = true;
            console.log(`✅ Added getPrisma in: ${filePath}`);
            break;
          }
        }
      }
      
      content = lines.join('\n');
    }

    if (changed) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⏭️ No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

console.log('🔍 Starting to fix files...\n');

filesToFix.forEach(fixFile);

console.log('\n🎉 Done!');