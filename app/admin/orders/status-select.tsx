"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  orderId: number;
  currentStatus: string;
}

export default function OrderStatusSelect({
  orderId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const updateStatus = async (value: string) => {
    if (value === status) return;
    
    setLoading(true);
    try {
      setStatus(value);

      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: value }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "خطا در بروزرسانی وضعیت سفارش");
      }

      // رفرش صفحه برای نمایش تغییرات
      router.refresh();
    } catch (error) {
      console.error(error);
      setStatus(currentStatus); // برگشت به وضعیت قبلی
      alert(error instanceof Error ? error.message : "خطا در بروزرسانی وضعیت سفارش");
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={status}
      onChange={(e) => updateStatus(e.target.value)}
      disabled={loading}
      className="
        px-4 py-2
        rounded-xl
        bg-zinc-900
        border border-white/10
        focus:border-violet-500
        outline-none
        transition-colors
        disabled:opacity-50
      "
    >
      <option value="REGISTERED">
        سفارش ثبت شده است
      </option>

      <option value="PAYED">
        پرداخت شده است
      </option>

      <option value="PROCESSING">
        سفارش در حال پردازش است
      </option>

      <option value="SHIPPING">
        سفارش در مرحله ارسال است
      </option>

      <option value="SHIPPED">
        سفارش ارسال شده است
      </option>

      <option value="CANCELLED">
        سفارش کنسل شده است
      </option>

      <option value="ERROR">
        خطا در پرداخت
      </option>
    </select>
  );
}