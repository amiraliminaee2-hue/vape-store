import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/isAdmin";
import { getPrisma } from "@/lib/prisma";

// Schema validation for params
const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/, "id باید عدد باشد"),
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "ابتدا وارد حساب کاربری شوید" },
        { status: 401 }
      );
    }

    const prisma = await getPrisma();
    const userId = session.user.id;
    const { id } = await params;

    // Validate params with Zod
    const paramsValidationResult = paramsSchema.safeParse({ id });
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

    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "نظر یافت نشد" },
        { status: 404 }
      );
    }

    // Check if user is admin OR the comment owner
    const adminAccess = await isAdmin(userId);
    const isOwner = comment.userId === userId;

    if (!adminAccess && !isOwner) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    await prisma.comment.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "خطا در حذف نظر" },
      { status: 500 }
    );
  }
}