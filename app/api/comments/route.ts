import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { getServerSession } from "next-auth";
import { validateCsrfToken } from "@/lib/csrf";
import { authOptions } from "@/lib/auth";
import { commentCreateSchema } from "@/lib/validations/schemas";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "شناسه محصول الزامی است" },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        productId: parseInt(productId),
        status: "APPROVED",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت نظرات" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "ابتدا وارد حساب کاربری شوید" },
        { status: 401 }
      );
    }

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

    // Get user info from our database
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const body = await request.json();
    
    // Zod validation
    const validationResult = commentCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "ورودی نامعتبر",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { productId, content, rating } = validationResult.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "محصول یافت نشد" },
        { status: 404 }
      );
    }

    const existingComment = await prisma.comment.findFirst({
      where: {
        userId,
        productId: productId,
      },
    });

    if (existingComment) {
      return NextResponse.json(
        { error: "شما قبلاً برای این محصول نظر ثبت کرده‌اید" },
        { status: 409 }
      );
    }

    const userName = userProfile?.firstName 
      ? `${userProfile.firstName} ${userProfile.lastName || ""}`.trim()
      : user?.name || "کاربر";

    const comment = await prisma.comment.create({
      data: {
        productId: productId,
        userId,
        userName,
        content: content.trim(),
        rating: rating,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      { comment, message: "نظر شما با موفقیت ثبت شد و پس از تأیید نمایش داده می‌شود" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "خطا در ثبت نظر" },
      { status: 500 }
    );
  }
}