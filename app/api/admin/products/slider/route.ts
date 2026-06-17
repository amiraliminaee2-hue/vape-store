import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/isAdmin";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const prisma = await getPrisma();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "discounted";

    let products = [];

    switch (type) {
      case "discounted":
        products = await prisma.product.findMany({
          where: { isActive: true, discountPercent: { gt: 0 } },
          take: 20,
          orderBy: { discountPercent: "desc" },
          include: { category: true, specs: true },
        });
        break;
      case "bestSelling":
        products = await prisma.product.findMany({
          where: { isActive: true, showInBestSelling: true },
          take: 20,
          orderBy: { orderItems: { _count: "desc" } },
          include: { category: true, specs: true },
        });
        break;
      case "featured":
        products = await prisma.product.findMany({
          where: { isActive: true, showInFeatured: true },
          take: 20,
          include: { category: true, specs: true },
        });
        break;
      case "permanent":
        products = await prisma.product.findMany({
          where: { isActive: true, showInPermanent: true },
          take: 20,
          include: { category: true, specs: true },
        });
        break;
      case "disposable":
        products = await prisma.product.findMany({
          where: { isActive: true, showInDisposable: true },
          take: 20,
          include: { category: true, specs: true },
        });
        break;
      case "packs":
        products = await prisma.product.findMany({
          where: { isActive: true, showInPacks: true },
          take: 20,
          include: { category: true, specs: true },
        });
        break;
      case "girls":
        products = await prisma.product.findMany({
          where: { isActive: true, showInGirls: true },
          take: 20,
          include: { category: true, specs: true },
        });
        break;
      case "liquids":
        products = await prisma.product.findMany({
          where: { isActive: true, showInLiquids: true },
          take: 20,
          include: { category: true, specs: true },
        });
        break;
      default:
        products = await prisma.product.findMany({
          where: { isActive: true },
          take: 20,
          orderBy: { createdAt: "desc" },
          include: { category: true, specs: true },
        });
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error("Slider products error:", error);
    return NextResponse.json({ error: "خطا در دریافت محصولات اسلایدر" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const body = await request.json();
    const { productId, field, value } = body;

    if (!productId || !field) {
      return NextResponse.json({ error: "productId و field الزامی است" }, { status: 400 });
    }

    const validFields = [
      "showInBestSelling",
      "showInFeatured",
      "showInPermanent",
      "showInDisposable",
      "showInPacks",
      "showInGirls",
      "showInLiquids",
    ];

    if (!validFields.includes(field)) {
      return NextResponse.json({ error: "فیلد نامعتبر است" }, { status: 400 });
    }

    const prisma = await getPrisma();

    const product = await prisma.product.update({
      where: { id: productId },
      data: { [field]: value },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Update slider product error:", error);
    return NextResponse.json({ error: "خطا در بروزرسانی محصول اسلایدر" }, { status: 500 });
  }
}