import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validations/schemas";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const userId = session.user.id;

    const addresses = await prisma.savedAddress.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Get addresses error:", error);
    return NextResponse.json({ error: "خطا در دریافت آدرس‌ها" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const userId = session.user.id;
    const body = await request.json();

    // Zod validation
    const validationResult = addressSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "ورودی نامعتبر",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { label, address } = validationResult.data;

    // اگر پروفایل وجود نداشت بساز
    await prisma.userProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const saved = await prisma.savedAddress.create({
      data: { userId, label: label.trim(), address: address.trim() },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Create address error:", error);
    return NextResponse.json({ error: "خطا در ذخیره آدرس" }, { status: 500 });
  }
}