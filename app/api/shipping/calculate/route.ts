import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const methodId = parseInt(searchParams.get("methodId")!);
    const province = searchParams.get("province");
    const totalWeight = parseInt(searchParams.get("totalWeight") || "0");

    if (!methodId) {
      return NextResponse.json({ error: "روش ارسال مشخص نشده" }, { status: 400 });
    }

    const method = await prisma.shippingMethod.findUnique({
      where: { id: methodId },
      include: { provincePrices: true },
    });

    if (!method) {
      return NextResponse.json({ error: "روش ارسال یافت نشد" }, { status: 404 });
    }

    let price = method.basePrice;

    // اگر استان مشخص شده، قیمت مخصوص استان را بررسی کن
    if (province) {
      const provincePrice = method.provincePrices.find(p => p.province === province);
      if (provincePrice) {
        price = provincePrice.price;
      }
    }

    // اضافه کردن هزینه بر اساس وزن
    if (method.pricePerKg && totalWeight > 0) {
      price += method.pricePerKg * Math.ceil(totalWeight / 1000);
    }

    return NextResponse.json({ price });
  } catch (error) {
    console.error("Error calculating shipping:", error);
    return NextResponse.json({ error: "خطا در محاسبه هزینه ارسال" }, { status: 500 });
  }
}