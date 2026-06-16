"use client";

import { useState } from "react";

interface CommentFormProps {
  productId: number;
  onSuccess?: () => void;
}

export default function CommentForm({ productId, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const renderStars = (interactive = true) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <button
        key={i}
        type="button"
        onClick={interactive ? () => setRating(i + 1) : undefined}
        className={`text-2xl transition-colors ${i < rating ? "text-yellow-400" : "text-zinc-600"} ${interactive ? "hover:text-yellow-300 cursor-pointer" : "cursor-default"}`}
      >
        ★
      </button>
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, content, rating }),
      });

      const data = await res.json();

      if (res.status === 401) {
        setMessage("ابتدا وارد حساب کاربری شوید");
      } else if (res.status === 409) {
        setMessage("شما قبلاً برای این محصول نظر ثبت کرده‌اید");
      } else if (res.ok) {
        setMessage(data.message || "نظر شما با موفقیت ثبت شد");
        setContent("");
        setRating(5);
        if (onSuccess) onSuccess();
      } else {
        setMessage(data.error || "خطا در ثبت نظر");
      }
    } catch (error) {
      console.error(error);
      setMessage("خطا در ثبت نظر");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 mb-10">
      <h3 className="text-xl font-semibold mb-6">ثبت نظر شما</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm text-zinc-400 mb-3">امتیاز شما</label>
          <div className="flex gap-1">{renderStars(true)}</div>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-2">نظر شما</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="تجربه خود را از این محصول بنویسید..."
            required
            className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 outline-none focus:border-violet-500/50 transition-colors resize-none"
          />
        </div>
        {message && (
          <p className={`text-sm px-4 py-3 rounded-xl ${message.includes("موفقیت") || message.includes("ثبت شد") ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {submitting ? "در حال ثبت..." : "ثبت نظر"}
        </button>
      </form>
    </div>
  );
}