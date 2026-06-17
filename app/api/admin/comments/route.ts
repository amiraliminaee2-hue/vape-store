import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/isAdmin";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

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

    const comments = await prisma.comment.findMany({
      where:
        status === "ALL"
          ? undefined
          : { status: status as "PENDING" | "APPROVED" | "REJECTED" },
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