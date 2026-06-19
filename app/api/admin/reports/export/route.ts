export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/isAdmin";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

interface UserExportData {
  "شناسه کاربری": string;
  "نام": string;
  "نام خانوادگی": string;
  "تلفن": string;
  "تعداد سفارشات": number;
  "مجموع خرید": number;
  "تاریخ عضویت": string;
  "وضعیت": string;
}

interface ProductExportData {
  "شناسه": number;
  "عنوان": string;
  "دسته‌بندی": string;
  "قیمت": number;
  "موجودی": number;
  "میانگین امتیاز": string;
  "تعداد نظرات": number;
  "وضعیت": string;
  "تاریخ ایجاد": string;
}

interface OrderExportData {
  "شماره پیگیری": string;
  "نام کاربر": string;
  "ایمیل": string;
  "تلفن": string;
  "آدرس": string;
  "محصولات": string;
  "جمع کل": number;
  "وضعیت": string;
  "تاریخ سفارش": string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !(await isAdmin(session.user.id))) {
      return NextResponse.json(
        { error: "دسترسی غیرمجاز" },
        { status: 403 }
      );
    }

    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const format = searchParams.get("format") || "xlsx";

    let data: UserExportData[] | ProductExportData[] | OrderExportData[] = [];
    let filename = "";

    if (type === "users") {
      const users = await prisma.userProfile.findMany({
        orderBy: { createdAt: "desc" },
        include: { savedAddresses: true },
      });

      const usersWithStats: UserExportData[] = await Promise.all(
        users.map(async (user: (typeof users)[number]) => {
          const ordersCount = await prisma.order.count({
            where: { userId: user.userId },
          });

          const totalSpent = await prisma.order.aggregate({
            where: { userId: user.userId, status: "PAYED" },
            _sum: { totalPrice: true },
          });

          return {
            "شناسه کاربری": user.userId,
            "نام": user.firstName || "",
            "نام خانوادگی": user.lastName || "",
            "تلفن": user.phone || "",
            "تعداد سفارشات": ordersCount,
            "مجموع خرید": totalSpent._sum.totalPrice || 0,
            "تاریخ عضویت": new Date(user.createdAt).toLocaleDateString("fa-IR"),
            "وضعیت": user.isBanned ? "بن شده" : "فعال",
          };
        })
      );

      data = usersWithStats;
      filename = `users_export_${new Date().toISOString().slice(0, 19)}`;

    } else if (type === "products") {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          comments: {
            where: { status: "APPROVED" },
            select: { rating: true },
          },
        },
      });

      const productsWithStats: ProductExportData[] = products.map(
        (product: (typeof products)[number]) => {
          const ratings = product.comments.map((c) => c.rating);
          const averageRating =
            ratings.length > 0
              ? ratings.reduce((a, b) => a + b, 0) / ratings.length
              : 0;

          return {
            "شناسه": product.id,
            "عنوان": product.title,
            "دسته‌بندی": product.category.name,
            "قیمت": product.price,
            "موجودی": product.stock,
            "میانگین امتیاز": averageRating.toFixed(1),
            "تعداد نظرات": product.comments.length,
            "وضعیت": product.isActive ? "فعال" : "غیرفعال",
            "تاریخ ایجاد": new Date(product.createdAt).toLocaleDateString("fa-IR"),
          };
        }
      );

      data = productsWithStats;
      filename = `products_export_${new Date().toISOString().slice(0, 19)}`;

    } else if (type === "orders") {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: { select: { title: true } },
            },
          },
        },
      });

      const ordersWithDetails: OrderExportData[] = orders.map(
        (order: (typeof orders)[number]) => {
          const itemsList = order.items
            .map((item) => `${item.product.title} (x${item.quantity})`)
            .join(", ");

          return {
            "شماره پیگیری": order.trackingNumber,
            "نام کاربر": order.userName,
            "ایمیل": order.userEmail,
            "تلفن": order.phone,
            "آدرس": order.address,
            "محصولات": itemsList,
            "جمع کل": order.totalPrice,
            "وضعیت": order.status,
            "تاریخ سفارش": new Date(order.createdAt).toLocaleDateString("fa-IR"),
          };
        }
      );

      data = ordersWithDetails;
      filename = `orders_export_${new Date().toISOString().slice(0, 19)}`;

    } else {
      return NextResponse.json(
        { error: "نوع گزارش نامعتبر است" },
        { status: 400 }
      );
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    if (format === "csv") {
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "خطا در خروجی گزارش" },
      { status: 500 }
    );
  }
}