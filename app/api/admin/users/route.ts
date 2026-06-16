import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/isAdmin";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    const where: Prisma.UserProfileWhereInput = {};

    if (search) {
      where.OR = [
        { userId: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "banned") {
      where.isBanned = true;
    } else if (status === "active") {
      where.isBanned = false;
    }

    const users = await prisma.userProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        savedAddresses: true,
      },
    });

    const total = await prisma.userProfile.count({ where });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const ordersCount = await prisma.order.count({
          where: { userId: user.userId },
        });

        const commentsCount = await prisma.comment.count({
          where: { userId: user.userId },
        });

        const totalSpent = await prisma.order.aggregate({
          where: { userId: user.userId, status: "PAYED" },
          _sum: { totalPrice: true },
        });

        return {
          ...user,
          ordersCount,
          commentsCount,
          totalSpent: totalSpent._sum.totalPrice || 0,
        };
      })
    );

    return NextResponse.json({
      users: usersWithStats,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json(
      { error: "خطا در دریافت کاربران" },
      { status: 500 }
    );
  }
}