"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReviewFormProps {
  productId: number;
}

export default function ReviewForm({ productId }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("لطفاً امتیاز خود را انتخاب کنید");
      return;
    }
    if (!content.trim()) {
      alert("لطفاً متن نظر خود را وارد کنید");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, content }),
      });
      if (res.ok) {
        alert("نظر شما با موفقیت ثبت شد");
        setRating(0);
        setContent("");
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "خطا در ثبت نظر");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-8">
      <h3 className="text-xl font-semibold mb-4">ثبت نظر شما</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-2">امتیاز شما</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-3xl transition-colors ${
                  star <= rating ? "text-yellow-400" : "text-zinc-600 hover:text-yellow-300"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">نظر شما</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full p-4 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none transition"
            placeholder="تجربه خود را از این محصول بنویسید..."
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50"
        >
          {submitting ? "در حال ثبت..." : "ثبت نظر"}
        </button>
      </form>
    </div>
  );
}