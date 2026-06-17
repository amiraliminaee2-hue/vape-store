import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { z } from "zod";

// Schema validation for PATCH request body
const patchBodySchema = z.object({
  action: z.enum(["increase", "decrease"]),
});

// Schema validation for params
const paramsSchema = z.object({
  productId: z.string().regex(/^\d+$/, "productId باید عدد باشد"),
});

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      productId: string;
    }>;
  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const prisma = await getPrisma();
    const userId = session.user.id;
    const { productId } = await params;

    // Validate params with Zod
    const paramsValidationResult = paramsSchema.safeParse({ productId });
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
    const bodyValidationResult = patchBodySchema.safeParse(body);
    if (!bodyValidationResult.success) {
      return NextResponse.json(
        {
          error: "ورودی نامعتبر. action باید increase یا decrease باشد",
          details: bodyValidationResult.error.issues,
        },
        {
          status: 400,
        }
      );
    }

    const { action } = bodyValidationResult.data;

    const cart = await prisma.cart.findUnique({
      where: {
        userId,
      },
    });

    if (!cart) {
      return NextResponse.json(
        {
          error: "سبد یافت نشد",
        },
        {
          status: 404,
        }
      );
    }

    const item = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: Number(productId),
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        {
          error: "آیتم یافت نشد",
        },
        {
          status: 404,
        }
      );
    }

    if (action === "increase") {
      await prisma.cartItem.update({
        where: {
          id: item.id,
        },
        data: {
          quantity: {
            increment: 1,
          },
        },
      });
    }

    if (action === "decrease") {
      if (item.quantity <= 1) {
        await prisma.cartItem.delete({
          where: {
            id: item.id,
          },
        });
      } else {
        await prisma.cartItem.update({
          where: {
            id: item.id,
          },
          data: {
            quantity: {
              decrement: 1,
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "خطا در بروزرسانی سبد",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      productId: string;
    }>;
  }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const prisma = await getPrisma();
    const userId = session.user.id;
    const { productId } = await params;

    // Validate params with Zod for DELETE
    const paramsValidationResult = paramsSchema.safeParse({ productId });
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

    const cart = await prisma.cart.findUnique({
      where: {
        userId,
      },
    });

    if (!cart) {
      return NextResponse.json({
        success: true,
      });
    }

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId: Number(productId),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "خطا در حذف آیتم",
      },
      {
        status: 500,
      }
    );
  }
}