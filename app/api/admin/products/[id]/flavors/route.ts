import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// ==========================================
// GET - دریافت تمام طعم‌های یک محصول
// ==========================================

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        {
          error: "شناسه محصول نامعتبر است",
        },
        {
          status: 400,
        }
      );
    }

    const prisma = await getPrisma();

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          error: "محصول پیدا نشد",
        },
        {
          status: 404,
        }
      );
    }

    const flavors = await prisma.flavor.findMany({
      where: {
        productId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(flavors);
  } catch (error) {
    console.error("GET flavors error:", error);

    return NextResponse.json(
      {
        error: "خطا در دریافت طعم‌ها",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// POST - افزودن طعم جدید
// ==========================================

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        {
          error: "شناسه محصول نامعتبر است",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const stock = Number(body.stock);

    const isActive =
      typeof body.isActive === "boolean"
        ? body.isActive
        : true;

    // ------------------------------------------
    // اعتبارسنجی
    // ------------------------------------------

    if (!name) {
      return NextResponse.json(
        {
          error: "نام طعم الزامی است",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        {
          error: "موجودی طعم نامعتبر است",
        },
        {
          status: 400,
        }
      );
    }

    const prisma = await getPrisma();

    // ------------------------------------------
    // بررسی وجود محصول
    // ------------------------------------------

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          error: "محصول پیدا نشد",
        },
        {
          status: 404,
        }
      );
    }

    // ------------------------------------------
    // جلوگیری از ثبت طعم تکراری
    // ------------------------------------------

    const existingFlavor =
      await prisma.flavor.findUnique({
        where: {
          productId_name: {
            productId,
            name,
          },
        },
      });

    if (existingFlavor) {
      return NextResponse.json(
        {
          error:
            "این طعم قبلاً برای این محصول ثبت شده است",
        },
        {
          status: 409,
        }
      );
    }

    // ------------------------------------------
    // ایجاد طعم
    // ------------------------------------------
    //
    // نکته:
    // قیمت طعم ثبت نمی‌شود.
    // قیمت همیشه از Product.price گرفته می‌شود.
    //
    // فیلد price در Prisma فعلاً nullable است،
    // بنابراین مقدار null قرار می‌دهیم.
    // ------------------------------------------

    const flavor = await prisma.flavor.create({
      data: {
        productId,
        name,
        stock,
        price: null,
        isActive,
      },
    });

    return NextResponse.json(
      flavor,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST flavor error:", error);

    return NextResponse.json(
      {
        error: "خطا در افزودن طعم",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// PUT - ویرایش طعم
// ==========================================

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        {
          error: "شناسه محصول نامعتبر است",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();

    const flavorId = Number(body.flavorId);

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const stock = Number(body.stock);

    const isActive =
      typeof body.isActive === "boolean"
        ? body.isActive
        : true;

    // ------------------------------------------
    // اعتبارسنجی
    // ------------------------------------------

    if (
      !Number.isInteger(flavorId) ||
      flavorId <= 0
    ) {
      return NextResponse.json(
        {
          error: "شناسه طعم نامعتبر است",
        },
        {
          status: 400,
        }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          error: "نام طعم الزامی است",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        {
          error: "موجودی طعم نامعتبر است",
        },
        {
          status: 400,
        }
      );
    }

    const prisma = await getPrisma();

    // ------------------------------------------
    // پیدا کردن طعم
    // ------------------------------------------

    const flavor =
      await prisma.flavor.findFirst({
        where: {
          id: flavorId,
          productId,
        },
      });

    if (!flavor) {
      return NextResponse.json(
        {
          error: "طعم پیدا نشد",
        },
        {
          status: 404,
        }
      );
    }

    // ------------------------------------------
    // جلوگیری از نام تکراری
    // ------------------------------------------

    const duplicateFlavor =
      await prisma.flavor.findFirst({
        where: {
          productId,
          name,
          NOT: {
            id: flavorId,
          },
        },
      });

    if (duplicateFlavor) {
      return NextResponse.json(
        {
          error:
            "این نام طعم قبلاً برای این محصول ثبت شده است",
        },
        {
          status: 409,
        }
      );
    }

    // ------------------------------------------
    // بروزرسانی طعم
    // ------------------------------------------
    //
    // قیمت طعم عمداً null باقی می‌ماند.
    // قیمت واقعی از Product.price گرفته می‌شود.
    // ------------------------------------------

    const updatedFlavor =
      await prisma.flavor.update({
        where: {
          id: flavorId,
        },
        data: {
          name,
          stock,
          price: null,
          isActive,
        },
      });

    return NextResponse.json(
      updatedFlavor
    );
  } catch (error) {
    console.error("PUT flavor error:", error);

    return NextResponse.json(
      {
        error: "خطا در بروزرسانی طعم",
      },
      {
        status: 500,
      }
    );
  }
}

// ==========================================
// DELETE - حذف طعم
// ==========================================

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        {
          error: "شناسه محصول نامعتبر است",
        },
        {
          status: 400,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const flavorId = Number(
      searchParams.get("flavorId")
    );

    if (
      !Number.isInteger(flavorId) ||
      flavorId <= 0
    ) {
      return NextResponse.json(
        {
          error: "شناسه طعم نامعتبر است",
        },
        {
          status: 400,
        }
      );
    }

    const prisma = await getPrisma();

    // ------------------------------------------
    // بررسی تعلق طعم به محصول
    // ------------------------------------------

    const flavor =
      await prisma.flavor.findFirst({
        where: {
          id: flavorId,
          productId,
        },
      });

    if (!flavor) {
      return NextResponse.json(
        {
          error: "طعم پیدا نشد",
        },
        {
          status: 404,
        }
      );
    }

    // ------------------------------------------
    // حذف طعم
    // ------------------------------------------

    await prisma.flavor.delete({
      where: {
        id: flavorId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "طعم با موفقیت حذف شد",
    });
  } catch (error) {
    console.error(
      "DELETE flavor error:",
      error
    );

    return NextResponse.json(
      {
        error: "خطا در حذف طعم",
      },
      {
        status: 500,
      }
    );
  }
}