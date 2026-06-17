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
  userName: string;
  userEmail: string;
  address: string;
  phone: string;
  customerNote: string | null;
  adminNote: string | null;
  totalPrice: number;
  discountAmount: number;
  couponCode: string | null;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

interface InvoiceItem {
  id: number;
  title: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceData {
  id: number;
  trackingNumber: string;
  transactionId: string | null;
  createdAt: string;
  status: string;
  userName: string;
  userEmail: string;
  phone: string;
  address: string;
  customerNote: string | null;
  adminNote: string | null;
  subtotal: number;
  couponCode: string | null;
  discountAmount: number;
  shippingCost: number;
  totalPrice: number;
  items: InvoiceItem[];
}

export default function UserOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = params?.id as string;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/account/orders/${orderId}`);
        if (!res.ok) {
          if (res.status === 404) {
            router.push("/account/orders");
          }
          throw new Error("خطا در دریافت سفارش");
        }
        const data = await res.json();
        setOrder(data);
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, router]);

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
          <Link href="/account/orders" className="mt-4 inline-block text-violet-400">
            بازگشت به لیست سفارش‌ها
          </Link>
        </div>
      </div>
    );
  }

  // تبدیل داده‌ها به فرمت InvoiceViewer
  const invoiceData: InvoiceData = {
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
    items: order.items.map((item: OrderItem): InvoiceItem => ({
      id: item.id,
      title: item.product.title,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    })),
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link href="/account/orders" className="text-zinc-400 hover:text-white">
            ← بازگشت به لیست سفارش‌ها
          </Link>
        </div>
        <InvoiceViewer data={invoiceData} showPrintButton={true} />
      </div>
    </div>
  );
}