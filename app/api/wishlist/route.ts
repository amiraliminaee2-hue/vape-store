import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

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
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Get wishlist error:", error);
    return NextResponse.json({ error: "خطا در دریافت علاقه‌مندی‌ها" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const userId = session.user.id;
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "productId الزامی است" }, { status: 400 });
    }

    // ✅ بررسی وجود کاربر در دیتابیس
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // اگر کاربر وجود نداشت، ایجادش کن
    if (!user) {
      const sessionUser = session.user;
      user = await prisma.user.create({
        data: {
          id: userId,
          email: sessionUser.email || `user-${userId}@temp.com`,
          name: sessionUser.name || "کاربر",
        },
      });
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
      return NextResponse.json({ added: false });
    }

    const item = await prisma.wishlistItem.create({
      data: {
        userId,
        productId: Number(productId),
      },
    });

    return NextResponse.json({ added: true, item }, { status: 201 });
  } catch (error) {
    console.error("Toggle wishlist error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "خطا در ویرایش علاقه‌مندی‌ها" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const userId = session.user.id;
    const url = new URL(request.url);
    const productId = url.pathname.split("/").pop();

    if (!productId || isNaN(Number(productId))) {
      return NextResponse.json({ error: "productId نامعتبر است" }, { status: 400 });
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        userId,
        productId: Number(productId),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete wishlist error:", error);
    return NextResponse.json({ error: "خطا در حذف از علاقه‌مندی‌ها" }, { status: 500 });
  }
}