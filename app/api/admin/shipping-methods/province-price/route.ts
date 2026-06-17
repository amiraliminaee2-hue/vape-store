import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/isAdmin";
import { getPrisma } from "@/lib/prisma";

// POST - ایجاد یا ویرایش قیمت استان
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const body = await req.json();
    const { province, shippingMethodId, price } = body;

    if (!province || !shippingMethodId || price === undefined) {
      return NextResponse.json({ error: "استان، روش ارسال و قیمت الزامی است" }, { status: 400 });
    }

    const provincePrice = await prisma.provinceShippingPrice.upsert({
      where: {
        province_shippingMethodId: {
          province,
          shippingMethodId,
        },
      },
      update: { price },
      create: { province, shippingMethodId, price },
    });

    return NextResponse.json(provincePrice);
  } catch (error) {
    console.error("Error setting province price:", error);
    return NextResponse.json({ error: "خطا در تنظیم قیمت استان" }, { status: 500 });
  }
}

// DELETE - حذف قیمت استان
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id")!);

    if (!id) {
      return NextResponse.json({ error: "آیدی الزامی است" }, { status: 400 });
    }

    await prisma.provinceShippingPrice.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting province price:", error);
    return NextResponse.json({ error: "خطا در حذف قیمت استان" }, { status: 500 });
  }
}