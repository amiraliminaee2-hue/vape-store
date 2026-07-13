// app/api/sellers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/isAdmin";
import { getPrisma } from "@/lib/prisma";

type SellerStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

interface SellerWhereInput {
  status?: SellerStatus;
  OR?: Array<{
    storeName?: { contains: string; mode: "insensitive" };
    slug?: { contains: string; mode: "insensitive" };
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const search = searchParams.get("search");

    if (!session?.user?.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    }

    const isAdminUser = await isAdmin(session.user.id);
    
    if (!isAdminUser) {
      const seller = await prisma.seller.findUnique({
        where: { userId: session.user.id },
      });
      return NextResponse.json({ sellers: seller ? [seller] : [] });
    }

    const where: SellerWhereInput = {};
    
    if (statusParam && statusParam !== "ALL") {
      where.status = statusParam as SellerStatus;
    }
    if (search) {
      where.OR = [
        { storeName: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const sellers = await prisma.seller.findMany({
      where,
      include: {
        user: {
          select: { id: true, phone: true },
        },
        products: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ sellers });
  } catch (error) {
    console.error("Get sellers error:", error);
    return NextResponse.json({ error: "خطا در دریافت فروشندگان" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const prisma = await getPrisma();
    const body = await request.json();
    const { action, ...data } = body;

    if (action === "create" || action === "request") {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "ابتدا وارد حساب کاربری خود شوید" }, { status: 401 });
      }

      const { storeName, slug, description, phone, address } = data;

      if (!storeName?.trim()) {
        return NextResponse.json({ error: "نام فروشگاه الزامی است" }, { status: 400 });
      }
      if (!slug?.trim()) {
        return NextResponse.json({ error: "slug الزامی است" }, { status: 400 });
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return NextResponse.json({ error: "slug نامعتبر است" }, { status: 400 });
      }
      if (!description?.trim()) {
        return NextResponse.json({ error: "توضیحات فروشگاه الزامی است" }, { status: 400 });
      }
      if (!phone?.trim()) {
        return NextResponse.json({ error: "شماره تماس الزامی است" }, { status: 400 });
      }
      if (!/^09[0-9]{9}$/.test(phone.trim())) {
        return NextResponse.json({ error: "شماره تماس نامعتبر است" }, { status: 400 });
      }

      const existingSeller = await prisma.seller.findUnique({
        where: { slug },
      });
      if (existingSeller) {
        return NextResponse.json({ error: "این slug قبلاً استفاده شده است" }, { status: 400 });
      }

      const existingUserSeller = await prisma.seller.findUnique({
        where: { userId: session.user.id },
      });
      if (existingUserSeller) {
        return NextResponse.json({ error: "شما قبلاً درخواست فروشندگی ثبت کرده‌اید" }, { status: 400 });
      }

      const seller = await prisma.seller.create({
        data: {
          userId: session.user.id,
          storeName: storeName.trim(),
          slug: slug.trim(),
          description: description.trim(),
          phone: phone.trim(),
          address: address?.trim() || null,
          status: "PENDING",
        },
      });

      return NextResponse.json({ success: true, seller });
    }

    if (action === "update") {
      if (!session?.user?.id || !(await isAdmin(session.user.id))) {
        return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
      }

      const { id, storeName, slug, description, phone, address, status, commission } = data;

      if (!id) {
        return NextResponse.json({ error: "شناسه فروشنده الزامی است" }, { status: 400 });
      }

      if (slug) {
        const existing = await prisma.seller.findFirst({
          where: {
            slug,
            id: { not: id },
          },
        });
        if (existing) {
          return NextResponse.json({ error: "این slug قبلاً استفاده شده است" }, { status: 400 });
        }
      }

      const updateData: {
        storeName?: string;
        slug?: string;
        description?: string | null;
        phone?: string | null;
        address?: string | null;
        status?: SellerStatus;
        commission?: number;
      } = {};
      
      if (storeName) updateData.storeName = storeName;
      if (slug) updateData.slug = slug;
      if (description) updateData.description = description;
      if (phone) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (status) updateData.status = status as SellerStatus;
      if (commission !== undefined) updateData.commission = commission;

      const seller = await prisma.seller.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ success: true, seller });
    }

    if (action === "delete") {
      if (!session?.user?.id || !(await isAdmin(session.user.id))) {
        return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
      }

      let { id } = data;
      
      if (!id) {
        const { searchParams } = new URL(request.url);
        id = searchParams.get("id");
      }

      if (!id) {
        return NextResponse.json({ error: "شناسه فروشنده الزامی است" }, { status: 400 });
      }

      await prisma.seller.delete({ where: { id } });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "اکشن نامعتبر. گزینه‌های مجاز: create, request, update, delete" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Seller operation error:", error);
    return NextResponse.json({ error: "خطا در عملیات فروشنده" }, { status: 500 });
  }
}