import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { productCreateSchema } from "@/lib/validations/schemas";

// تایپ برای ProductWhereInput
interface ProductWhereInput {
  isActive?: boolean;
  price?: {
    gte?: number;
    lte?: number;
  };
  categoryId?: number;
  title?: { contains: string; mode: "insensitive" };
  description?: { contains: string; mode: "insensitive" };
  specs?: {
    some: {
      OR: Array<{
        key?: { contains: string; mode: "insensitive" };
        value?: { contains: string; mode: "insensitive" };
      }>;
    };
  };
  OR?: Array<{
    title?: { contains: string; mode: "insensitive" };
    description?: { contains: string; mode: "insensitive" };
    specs?: {
      some: {
        OR: Array<{
          key?: { contains: string; mode: "insensitive" };
          value?: { contains: string; mode: "insensitive" };
        }>;
      };
    };
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim();
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Price range filters
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    const where: ProductWhereInput = {};

    const isAdmin = searchParams.get("admin") === "true";

    if (!isAdmin) {
      where.isActive = true;
    }

    // Apply price range filter
    if (minPrice || maxPrice) {
      const priceFilter: { gte?: number; lte?: number } = {};
      if (minPrice) {
        priceFilter.gte = parseInt(minPrice);
      }
      if (maxPrice) {
        priceFilter.lte = parseInt(maxPrice);
      }
      where.price = priceFilter;
    }

    // Get category ID if category slug is provided
    if (category) {
      const cat = await prisma.category.findUnique({
        where: { slug: category },
      });
      if (cat) {
        where.categoryId = cat.id;
      }
    }

    // ==================== FIXED SEARCH ====================
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        {
          specs: {
            some: {
              OR: [
                { key: { contains: search, mode: "insensitive" } },
                { value: { contains: search, mode: "insensitive" } }
              ]
            }
          }
        }
      ];
    }

    // Build orderBy
    const orderBy: {
      price?: "asc" | "desc";
      createdAt?: "desc";
      title?: "asc";
    } =
      sort === "price_asc"
        ? { price: "asc" }
        : sort === "price_desc"
        ? { price: "desc" }
        : sort === "name"
        ? { title: "asc" }
        : { createdAt: "desc" };

    // Get products with their comments for rating calculation
    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: true,
        specs: true,
        comments: {
          where: { status: "APPROVED" },
          select: { rating: true },
        },
      },
    });

    const total = await prisma.product.count({ where });

    // Transform products to include average rating
    const productsWithRating = products.map((product) => {
      const ratings = product.comments.map((c) => c.rating);
      const averageRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { comments, ...productWithoutComments } = product;
      
      return {
        ...productWithoutComments,
        discountPercent: product.discountPercent || 0,
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: ratings.length,
      };
    });

    return NextResponse.json({
      products: productsWithRating,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Products API Error:", error);

    return NextResponse.json(
      {
        error: "خطا در دریافت محصولات",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = await getPrisma();
    const body = await request.json();

    // Zod validation
    const validationResult = productCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "ورودی نامعتبر",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { title, slug, description, price, stock, images, isActive, isFeatured, categoryId, specs } = validationResult.data;

    // Sanitize description HTML to prevent XSS attacks
    const sanitizedDescription = description ? sanitizeHtml(description) : "";

    const product = await prisma.product.create({
      data: {
        title,
        slug,
        description: sanitizedDescription,
        price: price,
        discountPercent: 0,
        stock: stock,
        images: images || [],
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
        categoryId: categoryId,
        specs: {
          create:
            specs?.map(
              (s: {
                key: string;
                value: string;
              }) => ({
                key: s.key,
                value: s.value,
              })
            ) || [],
        },
      },

      include: {
        category: true,
        specs: true,
      },
    });

    return NextResponse.json(
      product,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Create product error:", error);

    return NextResponse.json(
      {
        error: "خطا در ایجاد محصول",
        details: String(error),
      },
      {
        status: 500,
      }
    );
  }
}