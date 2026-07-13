// app/api/admin/pages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/isAdmin";
import { getPrisma } from "@/lib/prisma";

interface PageCreateInput {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

interface PageUpdateInput extends PageCreateInput {
  id: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const statusParam = searchParams.get("status");
    const isAdminUser = session?.user?.id && (await isAdmin(session.user.id));

    if (slug) {
      const page = await prisma.page.findFirst({
        where: {
          slug,
          ...(isAdminUser ? {} : { status: "PUBLISHED" }),
        },
      });

      if (!page) {
        return NextResponse.json({ error: "صفحه یافت نشد" }, { status: 404 });
      }

      return NextResponse.json(page);
    }

    const where: {
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    } = {};
    
    if (!isAdminUser) {
      where.status = "PUBLISHED";
    }
    
    if (statusParam && isAdminUser && statusParam !== "ALL") {
      where.status = statusParam as "DRAFT" | "PUBLISHED" | "ARCHIVED";
    }

    const pages = await prisma.page.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, phone: true },
        },
      },
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Pages GET error:", error);
    return NextResponse.json({ error: "خطا در دریافت صفحات" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const body: PageCreateInput = await request.json();
    const { title, slug, content, excerpt, image, metaTitle, metaDescription, status } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: "عنوان، slug و محتوا الزامی است" }, { status: 400 });
    }

    const existing = await prisma.page.findUnique({
      where: { slug },
    });
    if (existing) {
      return NextResponse.json({ error: "این slug قبلاً استفاده شده است" }, { status: 400 });
    }

    const pageStatus = (status as "DRAFT" | "PUBLISHED" | "ARCHIVED") || "DRAFT";

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        image: image || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        status: pageStatus,
        publishedAt: pageStatus === "PUBLISHED" ? new Date() : null,
        authorId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error("Pages POST error:", error);
    return NextResponse.json({ error: "خطا در ایجاد صفحه" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const body: PageUpdateInput = await request.json();
    const { id, title, slug, content, excerpt, image, metaTitle, metaDescription, status } = body;

    if (!id) {
      return NextResponse.json({ error: "شناسه صفحه الزامی است" }, { status: 400 });
    }

    if (slug) {
      const existing = await prisma.page.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });
      if (existing) {
        return NextResponse.json({ error: "این slug قبلاً استفاده شده است" }, { status: 400 });
      }
    }

    const updateData: {
      title?: string;
      slug?: string;
      content?: string;
      excerpt?: string | null;
      image?: string | null;
      metaTitle?: string | null;
      metaDescription?: string | null;
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      publishedAt?: Date | null;
    } = {};

    if (title) updateData.title = title;
    if (slug) updateData.slug = slug;
    if (content) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt || null;
    if (image !== undefined) updateData.image = image || null;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle || null;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription || null;
    if (status) {
      updateData.status = status as "DRAFT" | "PUBLISHED" | "ARCHIVED";
      if (status === "PUBLISHED") {
        updateData.publishedAt = new Date();
      }
    }

    const page = await prisma.page.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error("Pages PUT error:", error);
    return NextResponse.json({ error: "خطا در بروزرسانی صفحه" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json({ error: "شناسه صفحه الزامی است" }, { status: 400 });
    }

    await prisma.page.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pages DELETE error:", error);
    return NextResponse.json({ error: "خطا در حذف صفحه" }, { status: 500 });
  }
}