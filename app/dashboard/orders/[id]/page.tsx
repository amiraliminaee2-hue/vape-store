"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OrderTimeline from "@/components/orders/OrderTimeline";

type OrderStatus = 
  | "REGISTERED"
  | "PAYED"
  | "PROCESSING"
  | "SHIPPING"
  | "SHIPPED"
  | "CANCELLED"
  | "ERROR";

const statusLabels: Record<OrderStatus, string> = {
  REGISTERED: "سفارش ثبت شده است",
  PAYED: "پرداخت شده است",
  PROCESSING: "در حال پردازش",
  SHIPPING: "در مرحله ارسال",
  SHIPPED: "ارسال شده",
  CANCELLED: "لغو شده",
  ERROR: "خطا در پرداخت",
};

const statusColors: Record<OrderStatus, string> = {
  REGISTERED: "bg-yellow-500/20 text-yellow-300",
  PAYED: "bg-emerald-500/20 text-emerald-300",
  PROCESSING: "bg-blue-500/20 text-blue-300",
  SHIPPING: "bg-orange-500/20 text-orange-300",
  SHIPPED: "bg-violet-500/20 text-violet-300",
  CANCELLED: "bg-red-500/20 text-red-300",
  ERROR: "bg-red-500/20 text-red-300",
};

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    title: string;
    price: number;
  };
}

interface Order {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  address: string;
  phone: string;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
}

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function OrderDetailsPage({ params }: PageParams) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrder() {
      const { id } = await params;
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else if (res.status === 404) {
          // notFound();
          router.push("/404");
        } else if (res.status === 401) {
          router.push("/auth/signin");
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [params, router]);

  const handleCancelOrder = async () => {
    if (!confirm("آیا از لغو این سفارش مطمئن هستید؟")) return;

    setCancelling(true);
    try {
      // Get CSRF token
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();

      const res = await fetch(`/api/orders/${order?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (res.ok) {
        alert("سفارش با موفقیت لغو شد");
        router.push("/dashboard/orders");
      } else {
        const data = await res.json();
        alert(data.error || "خطا در لغو سفارش");
      }
    } catch (error) {
      console.error("Cancel order error:", error);
      alert("خطا در لغو سفارش");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-10">
        <div className="text-center">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-5xl mx-auto p-10">
        <div className="text-center">سفارش یافت نشد</div>
      </div>
    );
  }

  const canCancel = order.status === "REGISTERED";

  return (
    <div className="max-w-5xl mx-auto p-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">
          سفارش #{order.id}
        </h1>

        <p className="mt-3 text-zinc-500">
          {new Date(order.createdAt).toLocaleDateString("fa-IR")}
        </p>
      </div>

      <div className="mb-10">
        <OrderTimeline status={order.status} />
      </div>

      <div className="flex items-center justify-between mb-8">
        <div
          className={`
            inline-flex
            px-4
            py-2
            rounded-full
            ${statusColors[order.status]}
          `}
        >
          {statusLabels[order.status]}
        </div>

        {canCancel && (
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="px-6 py-2 rounded-full bg-red-600 hover:bg-red-500 transition-colors text-white font-medium disabled:opacity-50"
          >
            {cancelling ? "در حال لغو..." : "لغو سفارش"}
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-bold mb-4">
            اطلاعات ارسال
          </h2>

          <p>{order.phone}</p>

          <p className="mt-3 text-zinc-400">
            {order.address}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 p-6">
          <h2 className="text-xl font-bold mb-4">
            مبلغ سفارش
          </h2>

          <p className="text-3xl font-bold">
            {order.totalPrice.toLocaleString("fa-IR")}
          </p>

          <p className="text-zinc-500 mt-2">
            تومان
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold">
            محصولات سفارش
          </h2>
        </div>

        <div className="divide-y divide-white/10">
          {order.items.map((item: OrderItem) => (
            <div
              key={item.id}
              className="p-6 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">
                  {item.product.title}
                </h3>
                <p className="text-zinc-500 mt-1">
                  تعداد: {item.quantity}
                </p>
              </div>
              <div>
                {(item.price * item.quantity).toLocaleString("fa-IR")} تومان
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}