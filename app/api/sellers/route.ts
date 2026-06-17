import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/isAdmin";
import { getPrisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// POST - ثبت درخواست فروشندگی
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "ابتدا وارد حساب کاربری خود شوید" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const body = await request.json();
    const { storeName, slug, description, phone, address } = body;

    // اعتبارسنجی
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

    // بررسی تکراری نبودن slug
    const existingSeller = await prisma.seller.findUnique({
      where: { slug },
    });
    if (existingSeller) {
      return NextResponse.json({ error: "این slug قبلاً استفاده شده است" }, { status: 400 });
    }

    // بررسی اینکه کاربر قبلاً درخواست فروشندگی نداده باشد
    const existingUserSeller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
    });
    if (existingUserSeller) {
      return NextResponse.json({ error: "شما قبلاً درخواست فروشندگی ثبت کرده‌اید" }, { status: 400 });
    }

    // ایجاد فروشنده
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
  } catch (error) {
    console.error("Create seller error:", error);
    return NextResponse.json({ error: "خطا در ثبت درخواست" }, { status: 500 });
  }
}

// GET - دریافت لیست فروشندگان (ادمین: همه، کاربر عادی: فقط وضعیت خودش)
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
    
    // اگر ادمین نیست، فقط اطلاعات فروشندگی خودش را ببیند
    if (!isAdminUser) {
      const seller = await prisma.seller.findUnique({
        where: { userId: session.user.id },
      });
      return NextResponse.json({ sellers: seller ? [seller] : [] });
    }

    // ادمین: لیست تمام فروشندگان با فیلتر
    const where: Prisma.SellerWhereInput = {};
    
    if (statusParam && statusParam !== "ALL") {
      where.status = statusParam as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
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
          select: { id: true, email: true, name: true },
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

// PUT - بروزرسانی فروشنده (فقط ادمین)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const body = await request.json();
    const { id, storeName, slug, description, phone, address, status, commission } = body;

    if (!id) {
      return NextResponse.json({ error: "شناسه فروشنده الزامی است" }, { status: 400 });
    }

    // بررسی تکراری نبودن slug در صورت تغییر
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

    const updateData: Prisma.SellerUpdateInput = {};
    if (storeName) updateData.storeName = storeName;
    if (slug) updateData.slug = slug;
    if (description) updateData.description = description;
    if (phone) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (status) updateData.status = status;
    if (commission !== undefined) updateData.commission = commission;

    const seller = await prisma.seller.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, seller });
  } catch (error) {
    console.error("Update seller error:", error);
    return NextResponse.json({ error: "خطا در بروزرسانی" }, { status: 500 });
  }
}

// DELETE - حذف فروشنده (فقط ادمین)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "شناسه فروشنده الزامی است" }, { status: 400 });
    }

    await prisma.seller.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete seller error:", error);
    return NextResponse.json({ error: "خطا در حذف فروشنده" }, { status: 500 });
  }
}