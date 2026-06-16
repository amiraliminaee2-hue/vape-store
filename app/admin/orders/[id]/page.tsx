"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import InvoiceViewer from "@/components/invoice/InvoiceViewer";

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    title: string;
    slug: string;
    images: string[];
  };
}

interface Order {
  id: number;
  trackingNumber: string;
  transactionId: string | null;
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
  createdAt: string;
  items: OrderItem[];
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const orderId = params?.id as string;

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/admin/orders");
        }
        throw new Error("خطا در دریافت سفارش");
      }
      const data = await res.json();
      setOrder(data);
      setAdminNote(data.adminNote || "");
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchOrder();
      } else {
        const error = await res.json();
        alert(error.error || "خطا در بروزرسانی وضعیت");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("خطا در بروزرسانی وضعیت");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const saveAdminNote = async () => {
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote }),
      });
      if (res.ok) {
        await fetchOrder();
        alert("یادداشت با موفقیت ذخیره شد");
      } else {
        const error = await res.json();
        alert(error.error || "خطا در ذخیره یادداشت");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      alert("خطا در ذخیره یادداشت");
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white p-8">
        <div className="text-center py-20">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#050505] text-white p-8">
        <div className="text-center py-20">
          <p className="text-zinc-500">سفارش یافت نشد</p>
          <Link href="/admin/orders" className="mt-4 inline-block text-violet-400">
            بازگشت به لیست سفارش‌ها
          </Link>
        </div>
      </div>
    );
  }

  // تبدیل داده‌ها به فرمت InvoiceViewer
  const invoiceData = {
    id: order.id,
    trackingNumber: order.trackingNumber,
    transactionId: order.transactionId,
    createdAt: order.createdAt,
    status: order.status,
    userName: order.userName,
    userEmail: order.userEmail,
    phone: order.phone,
    address: order.address,
    customerNote: order.customerNote,
    adminNote: order.adminNote,
    subtotal: order.totalPrice + (order.discountAmount || 0),
    couponCode: order.couponCode,
    discountAmount: order.discountAmount || 0,
    shippingCost: 0,
    totalPrice: order.totalPrice,
    items: order.items.map(item => ({
      id: item.id,
      title: item.product.title,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    })),
  };

  const statusOptions = [
    { value: "REGISTERED", label: "ثبت شده" },
    { value: "PAYED", label: "پرداخت شده" },
    { value: "PROCESSING", label: "در حال پردازش" },
    { value: "SHIPPING", label: "در حال ارسال" },
    { value: "SHIPPED", label: "ارسال شده" },
    { value: "CANCELLED", label: "لغو شده" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/admin/orders" className="text-zinc-400 hover:text-white">
            ← بازگشت به لیست سفارش‌ها
          </Link>
          <div className="flex items-center gap-4">
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* یادداشت مدیر */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="font-bold mb-3">یادداشت مدیر</h3>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none"
            placeholder="یادداشتی برای این سفارش وارد کنید..."
          />
          <button
            onClick={saveAdminNote}
            disabled={savingNote}
            className="mt-3 px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50"
          >
            {savingNote ? "در حال ذخیره..." : "ذخیره یادداشت"}
          </button>
        </div>

        {/* فاکتور */}
        <InvoiceViewer data={invoiceData} showPrintButton={true} />
      </div>
    </div>
  );
}