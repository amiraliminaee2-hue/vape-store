import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/isAdmin";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const body = await request.json();
    const { productId, discountPercent } = body;

    if (!productId) {
      return NextResponse.json({ error: "شناسه محصول الزامی است" }, { status: 400 });
    }

    if (discountPercent === undefined || discountPercent < 0 || discountPercent > 100) {
      return NextResponse.json({ error: "درصد تخفیف باید بین 0 تا 100 باشد" }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { discountPercent },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Set discount error:", error);
    return NextResponse.json({ error: "خطا در اعمال تخفیف" }, { status: 500 });
  }
}