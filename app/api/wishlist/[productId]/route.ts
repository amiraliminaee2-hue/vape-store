import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

// Schema validation for params
const paramsSchema = z.object({
  productId: z.string().regex(/^\d+$/, "productId باید عدد باشد"),
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const userId = session.user.id;
    const { productId } = await params;

    // Validate params with Zod
    const paramsValidationResult = paramsSchema.safeParse({ productId });
    if (!paramsValidationResult.success) {
      return NextResponse.json(
        {
          error: "پارامتر نامعتبر",
          details: paramsValidationResult.error.issues,
        },
        {
          status: 400,
        }
      );
    }

    await prisma.wishlistItem.deleteMany({
      where: { userId, productId: Number(productId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete wishlist error:", error);
    return NextResponse.json({ error: "خطا در حذف از علاقه‌مندی‌ها" }, { status: 500 });
  }
}