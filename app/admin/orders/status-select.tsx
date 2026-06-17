"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  orderId: number;
  currentStatus: string;
}

interface StatusOption {
  value: string;
  label: string;
}

const statusOptions: StatusOption[] = [
  { value: "REGISTERED", label: "سفارش ثبت شده است" },
  { value: "PAYED", label: "پرداخت شده است" },
  { value: "PROCESSING", label: "سفارش در حال پردازش است" },
  { value: "SHIPPING", label: "سفارش در مرحله ارسال است" },
  { value: "SHIPPED", label: "سفارش ارسال شده است" },
  { value: "CANCELLED", label: "سفارش کنسل شده است" },
  { value: "ERROR", label: "خطا در پرداخت" },
];

export default function OrderStatusSelect({
  orderId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(currentStatus);
  const [loading, setLoading] = useState<boolean>(false);

  const updateStatus = async (value: string): Promise<void> => {
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
      {statusOptions.map((option: StatusOption) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}