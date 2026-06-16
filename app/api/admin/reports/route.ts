import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/isAdmin";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const now = new Date();

    // ---- Daily Sales: last 30 days ----
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        totalPrice: true,
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Build daily map for last 30 days
    const dailyMap: Record<string, { revenue: number; count: number }> = {};

    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      dailyMap[key] = { revenue: 0, count: 0 };
    }

    for (const order of dailyOrders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      if (dailyMap[key]) {
        dailyMap[key].revenue += order.totalPrice;
        dailyMap[key].count += 1;
      }
    }

    const dailySales = Object.entries(dailyMap).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      count: data.count,
    }));

    // ---- Monthly Sales: last 12 months ----
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        totalPrice: true,
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Build monthly map for last 12 months
    const monthlyMap: Record<string, { revenue: number; count: number }> = {};

    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = { revenue: 0, count: 0 };
    }

    for (const order of monthlyOrders) {
      const d = order.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key]) {
        monthlyMap[key].revenue += order.totalPrice;
        monthlyMap[key].count += 1;
      }
    }

    const monthlySales = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      count: data.count,
    }));

    // ---- Summary Stats ----
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      totalRevenueResult,
      todayRevenueResult,
      weekRevenueResult,
      monthRevenueResult,
      totalOrdersCount,
      todayOrdersCount,
      weekOrdersCount,
      monthOrdersCount,
      topProducts,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalPrice: true },
      }),

      prisma.order.aggregate({
        where: { createdAt: { gte: startOfToday } },
        _sum: { totalPrice: true },
      }),

      prisma.order.aggregate({
        where: { createdAt: { gte: startOfWeek } },
        _sum: { totalPrice: true },
      }),

      prisma.order.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { totalPrice: true },
      }),

      prisma.order.count(),

      prisma.order.count({
        where: { createdAt: { gte: startOfToday } },
      }),

      prisma.order.count({
        where: { createdAt: { gte: startOfWeek } },
      }),

      prisma.order.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: {
          _sum: { quantity: "desc" },
        },
        take: 5,
      }),
    ]);

    // Get product names for top products
    const productIds = topProducts.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, price: true },
    });

    const topProductsWithNames = topProducts.map((tp) => {
      const product = products.find((p) => p.id === tp.productId);
      return {
        productId: tp.productId,
        title: product?.title ?? "ناشناخته",
        price: product?.price ?? 0,
        totalQuantity: tp._sum.quantity ?? 0,
        totalOrders: tp._count.id,
      };
    });

    return NextResponse.json({
      dailySales,
      monthlySales,
      summary: {
        totalRevenue: totalRevenueResult._sum.totalPrice ?? 0,
        todayRevenue: todayRevenueResult._sum.totalPrice ?? 0,
        weekRevenue: weekRevenueResult._sum.totalPrice ?? 0,
        monthRevenue: monthRevenueResult._sum.totalPrice ?? 0,
        totalOrders: totalOrdersCount,
        todayOrders: todayOrdersCount,
        weekOrders: weekOrdersCount,
        monthOrders: monthOrdersCount,
      },
      topProducts: topProductsWithNames,
    });
  } catch (error) {
    console.error("Reports API Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "خطای داخلی سرور",
      },
      { status: 500 }
    );
  }
}