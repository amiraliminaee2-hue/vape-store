import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { validateCsrfToken } from "@/lib/csrf";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { userProfileSchema } from "@/lib/validations/schemas";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const userId = session.user.id;

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: { savedAddresses: true },
    });

    return NextResponse.json(profile ?? { userId, firstName: "", lastName: "", phone: "", savedAddresses: [] });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ error: "خطا در دریافت پروفایل" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = await getPrisma();
    const userId = session.user.id;

    // CSRF Protection - Validate token
    const csrfToken = request.headers.get("X-CSRF-Token");
    if (!csrfToken) {
      return NextResponse.json(
        {
          error: "توکن امنیتی یافت نشد",
        },
        {
          status: 403,
        }
      );
    }

    if (!validateCsrfToken(userId, csrfToken)) {
      return NextResponse.json(
        {
          error: "توکن امنیتی نامعتبر است. لطفاً صفحه را بازخوانی کنید",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    // Zod validation
    const validationResult = userProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "ورودی نامعتبر",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { firstName, lastName, phone } = validationResult.data;

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: { firstName, lastName, phone },
      create: { userId, firstName, lastName, phone },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "خطا در ویرایش پروفایل" }, { status: 500 });
  }
}