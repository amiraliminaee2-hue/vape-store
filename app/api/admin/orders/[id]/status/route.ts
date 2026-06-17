import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/isAdmin";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["REGISTERED", "PAYED", "PROCESSING", "SHIPPING", "SHIPPED", "CANCELLED", "ERROR"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "وضعیت نامعتبر است" }, { status: 400 });
    }

    const prisma = await getPrisma();

    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { status },
    });

    return NextResponse.json({ success: true, status: order.status });
  } catch (error) {
    console.error("Update order status error:", error);
    return NextResponse.json({ error: "خطا در بروزرسانی وضعیت" }, { status: 500 });
  }
}