import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/isAdmin";
import { commentStatusSchema } from "@/lib/validations/schemas";
import { getPrisma } from "@/lib/prisma";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await _request.json();

    // Zod validation
    const validationResult = commentStatusSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "ورودی نامعتبر",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { status } = validationResult.data;

    // ✅ دریافت prisma در داخل تابع
    const prisma = await getPrisma();

    const comment = await prisma.comment.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Update comment error:", error);
    return NextResponse.json(
      { error: "خطا در ویرایش نظر" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // ✅ دریافت prisma در داخل تابع
    const prisma = await getPrisma();

    await prisma.comment.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete comment error:", error);
    return NextResponse.json(
      { error: "خطا در حذف نظر" },
      { status: 500 }
    );
  }
}