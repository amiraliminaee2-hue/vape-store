"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// تعریف interface برای CartItem
interface CartItem {
  productId?: number;
  id: number;
  quantity: number;
}

export default function SuccessPage() {
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<number | null>(null);

  useEffect(() => {
    const createOrder = async () => {
      try {
        const cart = JSON.parse(
          localStorage.getItem(
            "checkout-cart"
          ) || "[]"
        ) as CartItem[];

        if (!cart.length) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          "/api/orders",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              address:
                "آدرس تستی مشتری",
              phone:
                "09120000000",
              items: cart.map(
                (item: CartItem) => ({
                  productId:
                    item.productId ??
                    item.id,
                  quantity:
                    item.quantity,
                })
              ),
            }),
          }
        );

        const order =
          await res.json();

        setOrderId(order.id);

        localStorage.removeItem(
          "checkout-cart"
        );

        localStorage.removeItem(
          "vape-cart"
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    createOrder();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {loading ? (
          <>
            <h1 className="text-4xl font-bold">
              در حال ثبت سفارش...
            </h1>
          </>
        ) : (
          <>
            <h1 className="text-5xl font-bold text-green-400">
              پرداخت موفق
            </h1>

            <p className="mt-4 text-zinc-400">
              سفارش شما ثبت شد
            </p>

            {orderId && (
              <p className="mt-4 text-xl">
                شماره سفارش:
                {" "}
                #{orderId}
              </p>
            )}

            <Link
              href="/"
              className="
                inline-block
                mt-8
                px-6 py-3
                rounded-xl
                bg-violet-600
              "
            >
              بازگشت به سایت
            </Link>
          </>
        )}
      </div>
    </main>
  );
}