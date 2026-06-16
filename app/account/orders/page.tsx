"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Order {
  id: number;
  trackingNumber: string;
  totalPrice: number;
  discountAmount: number;
  couponCode: string | null;
  status: string;
  createdAt: string;
  items: {
    id: number;
    quantity: number;
    price: number;
    product: {
      id: number;
      title: string;
      slug: string;
    };
  }[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  REGISTERED: { label: "ثبت شده", color: "bg-yellow-500/20 text-yellow-400" },
  PAYED: { label: "پرداخت شده", color: "bg-blue-500/20 text-blue-400" },
  PROCESSING: { label: "در حال پردازش", color: "bg-purple-500/20 text-purple-400" },
  SHIPPING: { label: "در حال ارسال", color: "bg-orange-500/20 text-orange-400" },
  SHIPPED: { label: "ارسال شده", color: "bg-teal-500/20 text-teal-400" },
  CANCELLED: { label: "لغو شده", color: "bg-red-500/20 text-red-400" },
  ERROR: { label: "خطا", color: "bg-red-600/20 text-red-500" },
};

export default function UserOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!session?.user?.id) return;
      
      try {
        const res = await fetch("/api/account/orders");
        const data = await res.json();
        setOrders(data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchOrders();
    }
  }, [session, status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white p-8">
        <div className="text-center py-20">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">📦 سفارش‌های من</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 mb-4">هیچ سفارشی ثبت نکرده‌اید</p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition"
            >
              شروع خرید
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = statusLabels[order.status] || statusLabels.REGISTERED;
              const originalTotal = order.totalPrice + (order.discountAmount || 0);
              const hasDiscount = (order.discountAmount || 0) > 0;

              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="block rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-white/20 transition-all"
                >
                  <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-bold">
                          سفارش #{order.id}
                        </h2>
                        <span className="text-sm text-zinc-500 font-mono">
                          {order.trackingNumber}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-zinc-500 text-sm mt-2">
                        {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                      </p>
                      <div className="mt-3 text-sm text-zinc-400">
                        <p>تعداد اقلام: {order.items.length}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      {hasDiscount && (
                        <>
                          <p className="text-sm text-zinc-500 line-through">
                            {originalTotal.toLocaleString("fa-IR")} تومان
                          </p>
                          <p className="text-sm text-green-400">
                            تخفیف: -{order.discountAmount.toLocaleString("fa-IR")} تومان
                          </p>
                        </>
                      )}
                      <p className={`text-xl font-bold ${hasDiscount ? "text-green-400" : ""}`}>
                        {order.totalPrice.toLocaleString("fa-IR")} تومان
                      </p>
                      {order.couponCode && (
                        <p className="text-xs text-zinc-500 mt-1">
                          کد تخفیف: {order.couponCode}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* پیش‌نمایش محصولات */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex gap-3 flex-wrap">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="text-sm">
                          <span className="text-zinc-400">{item.quantity}×</span>
                          <span className="mr-1">{item.product.title}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <span className="text-sm text-zinc-500">
                          + {order.items.length - 3} محصول دیگر
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}