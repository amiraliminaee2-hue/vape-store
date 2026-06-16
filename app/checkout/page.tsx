"use client";

import { useState } from "react";

export default function CheckoutPage() {
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const submitOrder = async () => {
    const cart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    const res = await fetch("/api/orders", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        address,
        phone,
        items: cart,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.removeItem("cart");

      alert(
        `سفارش با موفقیت ثبت شد (#${data.id})`
      );

      location.href = "/";
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-8">
        ثبت سفارش
      </h1>

      <div className="space-y-5">

        <input
          placeholder="شماره موبایل"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
          className="w-full p-4 rounded-xl bg-zinc-900"
        />

        <textarea
          placeholder="آدرس"
          value={address}
          onChange={(e) =>
            setAddress(e.target.value)
          }
          className="w-full p-4 rounded-xl bg-zinc-900"
          rows={5}
        />

        <button
          onClick={submitOrder}
          className="
            w-full
            py-4
            rounded-xl
            bg-violet-600
          "
        >
          ثبت سفارش
        </button>

      </div>
    </div>
  );
}