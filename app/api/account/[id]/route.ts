import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // ✅ دریافت prisma از getPrisma
    const prisma = await getPrisma();

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "خطا در دریافت اطلاعات کاربر" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // ✅ دریافت prisma از getPrisma
    const prisma = await getPrisma();

    const user = await prisma.user.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "خطا در بروزرسانی کاربر" }, { status: 500 });
  }
}