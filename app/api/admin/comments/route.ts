import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/isAdmin";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";

    const prisma = await getPrisma();

    // ساخت where condition به صورت شرطی
    const whereCondition: Prisma.CommentWhereInput = status !== "ALL"
      ? {
          status: status as "PENDING" | "APPROVED" | "REJECTED",
        }
      : {};

    const comments = await prisma.comment.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Admin get comments error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت نظرات" },
      { status: 500 }
    );
  }
}