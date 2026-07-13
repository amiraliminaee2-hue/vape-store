// app/api/admin/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/isAdmin";
import { commentStatusSchema } from "@/lib/validations/schemas";
import { getPrisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
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
    const body = await request.json();
    const { action, ...data } = body;

    if (action === "update") {
      const validationResult = commentStatusSchema.safeParse(data);
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
      const prisma = await getPrisma();

      const comment = await prisma.comment.update({
        where: { id: parseInt(id) },
        data: { status },
      });

      return NextResponse.json({ comment });
    } 
    
    else if (action === "delete") {
      const prisma = await getPrisma();

      await prisma.comment.delete({
        where: { id: parseInt(id) },
      });

      return NextResponse.json({ success: true });
    } 
    
    else {
      return NextResponse.json(
        { error: "اکشن نامعتبر" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Comment operation error:", error);
    return NextResponse.json(
      { error: "خطا در انجام عملیات" },
      { status: 500 }
    );
  }
}