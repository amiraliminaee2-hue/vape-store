import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";

// Schema validation for params
const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/, "id باید عدد باشد"),
});

// Schema validation for PUT request body
const putBodySchema = z.object({
  label: z.string().min(1, "برچسب آدرس نمی‌تواند خالی باشد").max(50, "برچسب آدرس حداکثر ۵۰ کاراکتر است"),
  address: z.string().min(5, "آدرس حداقل ۵ کاراکتر باید باشد").max(500, "آدرس حداکثر ۵۰۰ کاراکتر است"),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const body = await request.json();

    // Validate body with Zod
    const bodyValidationResult = putBodySchema.safeParse(body);
    if (!bodyValidationResult.success) {
      return NextResponse.json(
        {
          error: "ورودی نامعتبر",
          details: bodyValidationResult.error.issues,
        },
        {
          status: 400,
        }
      );
    }

    const { label, address } = bodyValidationResult.data;

    const existing = await prisma.savedAddress.findFirst({
      where: { id: Number(id), userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "آدرس یافت نشد" }, { status: 404 });
    }

    const updated = await prisma.savedAddress.update({
      where: { id: Number(id) },
      data: { label: label.trim(), address: address.trim() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update address error:", error);
    return NextResponse.json({ error: "خطا در ویرایش آدرس" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const existing = await prisma.savedAddress.findFirst({
      where: { id: Number(id), userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "آدرس یافت نشد" }, { status: 404 });
    }

    await prisma.savedAddress.delete({ where: { id: Number(id) } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete address error:", error);
    return NextResponse.json({ error: "خطا در حذف آدرس" }, { status: 500 });
  }
}