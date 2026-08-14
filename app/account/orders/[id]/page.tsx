"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import InvoiceViewer from "@/components/invoice/InvoiceViewer";

interface OrderItemFlavor {
  id: number;
  flavorId: number;
  quantity: number;
  price: number;
  flavor: {
    id: number;
    name: string;
  };
}

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

  /*
   * طعم‌های انتخاب شده برای این آیتم
   */
  flavors?: OrderItemFlavor[];
}

interface Order {
  id: number;
  trackingNumber: string;
  transactionId: string | null;
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

interface InvoiceItemFlavor {
  id: number;
  flavorId: number;
  name: string;
  quantity: number;
  price: number;
}

interface InvoiceItem {
  id: number;
  title: string;
  quantity: number;
  price: number;
  total: number;

  /*
   * اطلاعات کامل طعم‌های انتخاب شده
   *
   * برخلاف نسخه قبلی، فقط نام طعم منتقل نمی‌شود.
   * quantity نیز منتقل می‌شود تا در فاکتور نمایش داده شود.
   */
  flavors: InvoiceItemFlavor[];
}

interface InvoiceData {
  id: number;
  trackingNumber: string;
  transactionId: string | null;
  createdAt: string;
  status: string;
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

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const orderId =
    params?.["id"] as string;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res =
          await fetch(
            `/api/account/orders/${orderId}`
          );

        if (!res.ok) {
          if (res.status === 404) {
            router.push(
              "/account/orders"
            );
          }

          throw new Error(
            "خطا در دریافت سفارش"
          );
        }

        const data =
          await res.json();

        setOrder(data);
      } catch (error) {
        console.error(
          "Error fetching order:",
          error
        );
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
        <div className="text-center py-20">
          در حال بارگذاری...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#050505] text-white p-8">
        <div className="text-center py-20">
          <p className="text-zinc-500">
            سفارش یافت نشد
          </p>

          <Link
            href="/account/orders"
            className="mt-4 inline-block text-violet-400"
          >
            بازگشت به لیست سفارش‌ها
          </Link>
        </div>
      </div>
    );
  }

  const invoiceData: InvoiceData = {
    id: order.id,

    trackingNumber:
      order.trackingNumber,

    transactionId:
      order.transactionId,

    createdAt:
      order.createdAt,

    status:
      order.status,

    phone:
      order.phone,

    address:
      order.address,

    customerNote:
      order.customerNote,

    adminNote:
      order.adminNote,

    subtotal:
      order.totalPrice +
      (order.discountAmount || 0),

    couponCode:
      order.couponCode,

    discountAmount:
      order.discountAmount || 0,

    shippingCost: 0,

    totalPrice:
      order.totalPrice,

    items:
      order.items.map(
        (
          item: OrderItem
        ): InvoiceItem => {
          /*
           * ---------------------------------------------------
           * استخراج اطلاعات کامل طعم‌های انتخاب شده
           * ---------------------------------------------------
           *
           * در نسخه قبلی فقط flavor.name
           * منتقل می‌شد و quantity از بین می‌رفت.
           *
           * اکنون:
           *
           * name
           * quantity
           * price
           *
           * همگی منتقل می‌شوند.
           * ---------------------------------------------------
           */

          const flavors: InvoiceItemFlavor[] =
            item.flavors?.map(
              (
                flavorItem
              ): InvoiceItemFlavor => ({
                id:
                  flavorItem.id,

                flavorId:
                  flavorItem.flavorId,

                name:
                  flavorItem.flavor?.name ||
                  "نامشخص",

                quantity:
                  flavorItem.quantity,

                price:
                  flavorItem.price,
              })
            ) || [];

          /*
           * ---------------------------------------------------
           * عنوان محصول
           * ---------------------------------------------------
           *
           * طعم دیگر داخل title قرار نمی‌گیرد.
           *
           * قبلاً:
           *
           * test - طعم: توت‌فرنگی، انبه
           *
           * ساخته می‌شد.
           *
           * اکنون عنوان فقط نام محصول است و
           * طعم‌ها به صورت جداگانه در InvoiceViewer
           * نمایش داده می‌شوند.
           * ---------------------------------------------------
           */

          const itemTitle =
            item.product.title;

          return {
            id:
              item.id,

            title:
              itemTitle,

            quantity:
              item.quantity,

            price:
              item.price,

            total:
              item.price *
              item.quantity,

            flavors,
          };
        }
      ),
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            href="/account/orders"
            className="text-zinc-400 hover:text-white"
          >
            ← بازگشت به لیست سفارش‌ها
          </Link>
        </div>

        <InvoiceViewer
          data={invoiceData}
          showPrintButton={true}
        />
      </div>
    </div>
  );
}