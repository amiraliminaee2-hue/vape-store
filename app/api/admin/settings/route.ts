// app/api/admin/sellers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/isAdmin";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

// تعریف تایپ برای SellerStatus
type SellerStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

// تعریف تایپ برای Seller با Products
interface SellerWithProducts {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  phone: string | null;
  address: string | null;
  status: SellerStatus;
  commission: number;
  totalSales: number;
  totalEarned: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string | null;
    name: string | null;
  };
  products: {
    id: number;
  }[];
}

// تعریف تایپ برای where
interface SellerWhereInput {
  status?: SellerStatus;
  OR?: Array<{
    storeName?: { contains: string; mode: "insensitive" };
    slug?: { contains: string; mode: "insensitive" };
    phone?: { contains: string; mode: "insensitive" };
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    // اگر id وجود دارد، یک فروشنده خاص را برگردان
    if (id) {
      const seller = await prisma.seller.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          products: {
            select: {
              id: true,
              title: true,
              price: true,
              stock: true,
              isActive: true,
              images: true,
            },
          },
        },
      });

      if (!seller) {
        return NextResponse.json(
          { error: "فروشنده یافت نشد" },
          { status: 404 }
        );
      }

      return NextResponse.json(seller);
    }

    // اگر id وجود نداشت، لیست فروشندگان را برگردان (با فیلتر و صفحه‌بندی)
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: SellerWhereInput = {};

    if (status && status !== "ALL") {
      where.status = status as SellerStatus;
    }

    if (search) {
      where.OR = [
        { storeName: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [sellers, total] = await Promise.all([
      prisma.seller.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          products: {
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.seller.count({ where }),
    ]);

    const sellersWithProductCount = (sellers as SellerWithProducts[]).map((seller) => ({
      ...seller,
      productsCount: seller.products.length,
      products: undefined,
    }));

    return NextResponse.json({
      sellers: sellersWithProductCount,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET sellers error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت فروشندگان" },
      { status: 500 }
    );
  }
}

// ✅ فقط یک POST که همه عملیات‌ها را مدیریت می‌کند
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const prisma = await getPrisma();
    const body = await request.json();
    const { action, ...data } = body;

    // ============================================
    // 1️⃣ ایجاد فروشنده جدید (CREATE)
    // ============================================
    if (action === "create") {
      const { userId, storeName, slug, description, logo, coverImage, phone, address, commission, status } = data;

      if (!userId || !storeName || !slug) {
        return NextResponse.json(
          { error: "اطلاعات فروشنده ناقص است" },
          { status: 400 }
        );
      }

      // بررسی تکراری نبودن slug
      const existingSlug = await prisma.seller.findUnique({
        where: { slug },
      });

      if (existingSlug) {
        return NextResponse.json(
          { error: "این slug قبلاً استفاده شده است" },
          { status: 400 }
        );
      }

      // بررسی وجود کاربر
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return NextResponse.json(
          { error: "کاربر یافت نشد" },
          { status: 404 }
        );
      }

      const seller = await prisma.seller.create({
        data: {
          userId,
          storeName,
          slug,
          description,
          logo,
          coverImage,
          phone,
          address,
          commission: commission || 10,
          status: status || "PENDING",
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      return NextResponse.json(seller, { status: 201 });
    }

    // ============================================
    // 2️⃣ بروزرسانی فروشنده (UPDATE)
    // ============================================
    if (action === "update") {
      // دریافت id از body یا از query params
      const { id, status, commission, storeName, description, phone, address } = data;

      if (!id) {
        return NextResponse.json(
          { error: "شناسه فروشنده الزامی است" },
          { status: 400 }
        );
      }

      const seller = await prisma.seller.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(commission !== undefined && { commission }),
          ...(storeName && { storeName }),
          ...(description !== undefined && { description }),
          ...(phone !== undefined && { phone }),
          ...(address !== undefined && { address }),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      return NextResponse.json(seller);
    }

    // ============================================
    // 3️⃣ حذف فروشنده (DELETE)
    // ============================================
    if (action === "delete") {
      // دریافت id از body یا از query params
      const { id } = data;

      if (!id) {
        return NextResponse.json(
          { error: "شناسه فروشنده الزامی است" },
          { status: 400 }
        );
      }

      await prisma.seller.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    }

    // ============================================
    // اگر action معتبر نبود
    // ============================================
    return NextResponse.json(
      { error: "اکشن نامعتبر. گزینه‌های مجاز: create, update, delete" },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST seller error:", error);
    return NextResponse.json(
      { error: "خطا در عملیات فروشنده" },
      { status: 500 }
    );
  }
}