import { getPrisma } from "@/lib/prisma";
import OrderStatusSelect from "./status-select";
import { Suspense } from "react";
import ExportButtons from "@/components/admin/ExportButtons";
import AdminNoteEditor from "@/components/admin/AdminNoteEditor";

const statusColors: Record<string, string> = {
  REGISTERED: "bg-yellow-500/20 text-yellow-300",
  PAYED: "bg-emerald-500/20 text-emerald-300",
  PROCESSING: "bg-blue-500/20 text-blue-300",
  SHIPPING: "bg-orange-500/20 text-orange-300",
  SHIPPED: "bg-violet-500/20 text-violet-300",
  CANCELLED: "bg-red-500/20 text-red-300",
  ERROR: "bg-red-500/20 text-red-300",
};

const statusLabels: Record<string, string> = {
  REGISTERED: "سفارش ثبت شده است",
  PAYED: "پرداخت شده است",
  PROCESSING: "سفارش در حال پردازش است",
  SHIPPING: "سفارش در مرحله ارسال است",
  SHIPPED: "سفارش ارسال شده است",
  CANCELLED: "سفارش کنسل شده است",
  ERROR: "خطا در پرداخت",
};

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    title: string;
  };
}

interface Order {
  id: number;
  trackingNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  address: string;
  phone: string;
  customerNote: string | null;
  adminNote: string | null;
  totalPrice: number;
  couponCode: string | null;
  discountAmount: number;
  status: string;
  createdAt: Date;
  items: OrderItem[];
}

interface SearchParams {
  search?: string;
}

// تایپ برای where condition
interface OrderWhereInput {
  OR?: Array<{
    [key: string]: {
      contains: string;
      mode: "insensitive";
    };
  }>;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { search = "" } = await searchParams;

  const prisma = await getPrisma();

  // ساخت where condition به صورت شرطی
  const whereCondition: OrderWhereInput = search
    ? {
        OR: [
          {
            phone: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            userEmail: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            userName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            trackingNumber: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : {};

  const orders: Order[] = await prisma.order.findMany({
    where: whereCondition,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  const registered: number = orders.filter(
    (o: Order) => o.status === "REGISTERED"
  ).length;

  const processing: number = orders.filter(
    (o: Order) => o.status === "PROCESSING"
  ).length;

  const shipping: number = orders.filter(
    (o: Order) => o.status === "SHIPPING"
  ).length;

  const shipped: number = orders.filter(
    (o: Order) => o.status === "SHIPPED"
  ).length;

  // محاسبه مجموع تخفیف‌ها
  const totalDiscount: number = orders.reduce((sum: number, order: Order) => sum + (order.discountAmount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header with Export Buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">
            مدیریت سفارشات
          </h1>
          <p className="mt-2 text-zinc-500">
            {orders.length} سفارش ثبت شده
          </p>
        </div>
        <Suspense fallback={<div className="w-48 h-10" />}>
          <ExportButtons type="orders" />
        </Suspense>
      </div>

      <form>
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="جستجو با نام، ایمیل، موبایل یا شماره پیگیری..."
          className="
            w-full
            rounded-2xl
            border border-white/10
            bg-black/30
            p-4
            outline-none
          "
        />
      </form>

      <div className="grid md:grid-cols-5 gap-4">
        <div className="rounded-3xl border border-white/10 p-5">
          <p className="text-zinc-500">ثبت شده</p>
          <p className="text-3xl font-bold mt-3">
            {registered}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 p-5">
          <p className="text-zinc-500">
            در حال پردازش
          </p>
          <p className="text-3xl font-bold mt-3">
            {processing}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 p-5">
          <p className="text-zinc-500">
            در مرحله ارسال
          </p>
          <p className="text-3xl font-bold mt-3">
            {shipping}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 p-5">
          <p className="text-zinc-500">
            ارسال شده
          </p>
          <p className="text-3xl font-bold mt-3">
            {shipped}
          </p>
        </div>

        <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-5">
          <p className="text-zinc-500">مجموع تخفیف‌ها</p>
          <p className="text-3xl font-bold mt-3 text-green-400">
            {totalDiscount.toLocaleString("fa-IR")} تومان
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {orders.map((order: Order) => {
          const originalTotal: number = order.totalPrice + (order.discountAmount || 0);
          const hasDiscount: boolean = (order.discountAmount || 0) > 0;
          
          return (
            <div
              key={order.id}
              className="
                rounded-3xl
                border border-white/10
                bg-white/[0.02]
                p-6
                hover:border-white/20
                transition-colors
              "
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">
                      سفارش #{order.id}
                    </h2>
                    <span className="text-sm text-zinc-500 font-mono">
                      {order.trackingNumber}
                    </span>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div>
                      <p className="text-sm text-zinc-500">
                        مشتری
                      </p>
                      <p className="font-semibold">
                        {order.userName || "کاربر"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-500">
                        ایمیل
                      </p>
                      <p>{order.userEmail || "-"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-500">
                        موبایل
                      </p>
                      <p>{order.phone}</p>
                    </div>

                    <div>
                      <p className="text-sm text-zinc-500">
                        آدرس
                      </p>
                      <p className="text-zinc-300 line-clamp-2">
                        {order.address}
                      </p>
                    </div>

                    {/* Admin Note Section */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-sm text-zinc-500 mb-2">
                        یادداشت ادمین
                      </p>
                      <AdminNoteEditor
                        orderId={order.id}
                        initialNote={order.adminNote || ""}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  <div
                    className={`
                      inline-flex
                      px-3 py-1
                      rounded-full
                      text-sm
                      ${statusColors[order.status]}
                    `}
                  >
                    {statusLabels[order.status] || order.status}
                  </div>
                  
                  {/* بخش قیمت با تخفیف */}
                  <div className="mt-3 text-right">
                    {hasDiscount && (
                      <>
                        <p className="text-sm text-zinc-500 line-through">
                          {originalTotal.toLocaleString("fa-IR")} تومان
                        </p>
                        <p className="text-sm text-green-400">
                          تخفیف: -{(order.discountAmount || 0).toLocaleString("fa-IR")} تومان
                        </p>
                      </>
                    )}
                    <p className={`font-bold text-lg ${hasDiscount ? "text-green-400" : ""}`}>
                      {order.totalPrice.toLocaleString("fa-IR")} تومان
                    </p>
                    {order.couponCode && (
                      <p className="text-xs text-zinc-500 mt-1">
                        کد: {order.couponCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-sm text-zinc-500 mb-2">محصولات</p>
                {order.items.map((item: OrderItem) => (
                  <div
                    key={item.id}
                    className="flex justify-between py-2 text-sm"
                  >
                    <span>{item.product.title}</span>
                    <span className="text-zinc-400">
                      {item.quantity} × {item.price.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <OrderStatusSelect
                  orderId={order.id}
                  currentStatus={order.status}
                />
              </div>
            </div>
          );
        })}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          هیچ سفارشی یافت نشد
        </div>
      )}
    </div>
  );
}