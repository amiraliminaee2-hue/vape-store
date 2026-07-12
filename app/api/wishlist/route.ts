// app/api/wishlist/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

// تعریف interface برای WishlistItem با Product
interface WishlistItemWithProduct {
  id: number;
  userId: string;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: number;
    title: string;
    price: number;
    stock: number;
    images: string[];
    isFeatured: boolean;
    slug: string;
  };
}

// تعریف interface برای User
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const userId = session.user.id;

    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            stock: true,
            images: true,
            isFeatured: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }) as WishlistItemWithProduct[];

    return NextResponse.json(items);
  } catch (error) {
    console.error("Get wishlist error:", error);
    return NextResponse.json({ error: "خطا در دریافت علاقه‌مندی‌ها" }, { status: 500 });
  }
}

// ✅ فقط یک POST که همه عملیات‌ها را مدیریت می‌کند
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const userId = session.user.id;
    const body = await request.json();
    const { action, ...data } = body;

    // ============================================
    // 1️⃣ افزودن/حذف (Toggle) - اگر وجود داشت حذف کن، اگر نبود اضافه کن
    // ============================================
    if (action === "toggle") {
      const { productId } = data;

      if (!productId) {
        return NextResponse.json({ error: "productId الزامی است" }, { status: 400 });
      }

      // ✅ بررسی وجود کاربر در دیتابیس
      let user = await prisma.user.findUnique({
        where: { id: userId },
      }) as User | null;

      // اگر کاربر وجود نداشت، ایجادش کن
      if (!user) {
        const sessionUser = session.user;
        user = await prisma.user.create({
          data: {
            id: userId,
            email: sessionUser.email || `user-${userId}@temp.com`,
            name: sessionUser.name || "کاربر",
          },
        }) as User;
        console.log("✅ User created in database:", user.id);
      }

      // بررسی وجود محصول
      const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
      });

      if (!product) {
        return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
      }

      const existing = await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: {
            userId,
            productId: Number(productId),
          },
        },
      });

      if (existing) {
        // اگر قبلاً اضافه شده، حذف کن (toggle)
        await prisma.wishlistItem.delete({
          where: {
            userId_productId: {
              userId,
              productId: Number(productId),
            },
          },
        });
        return NextResponse.json({ added: false, message: "از علاقه‌مندی‌ها حذف شد" });
      }

      const item = await prisma.wishlistItem.create({
        data: {
          userId,
          productId: Number(productId),
        },
      });

      return NextResponse.json({ added: true, item, message: "به علاقه‌مندی‌ها اضافه شد" }, { status: 201 });
    }

    // ============================================
    // 2️⃣ حذف مستقیم از علاقه‌مندی‌ها (DELETE)
    // ============================================
    if (action === "delete") {
      // دریافت productId از body
      let { productId } = data;
      
      // اگر در body نبود، از query params یا path دریافت کن (برای سازگاری با کد قدیمی)
      if (!productId) {
        const url = new URL(request.url);
        // تلاش برای دریافت از searchParams
        productId = url.searchParams.get("productId");
        
        // اگر در searchParams نبود، از path دریافت کن (آخرین بخش)
        if (!productId) {
          const pathParts = url.pathname.split("/");
          productId = pathParts[pathParts.length - 1];
        }
      }

      if (!productId || isNaN(Number(productId))) {
        return NextResponse.json({ error: "productId معتبر الزامی است" }, { status: 400 });
      }

      await prisma.wishlistItem.deleteMany({
        where: {
          userId,
          productId: Number(productId),
        },
      });

      return NextResponse.json({ success: true, message: "با موفقیت حذف شد" });
    }

    // ============================================
    // اگر action معتبر نبود
    // ============================================
    return NextResponse.json(
      { error: "اکشن نامعتبر. گزینه‌های مجاز: toggle, delete" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Wishlist operation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "خطا در عملیات علاقه‌مندی‌ها" },
      { status: 500 }
    );
  }
}