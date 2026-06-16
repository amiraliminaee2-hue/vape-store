"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import StarRating from "./StarRating";

interface Comment {
  id: number;
  userName: string;
  rating: number;
  content: string;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null; // ✅ اصلاح: اضافه کردن nullable
  };
}

interface ProductReviewsProps {
  productId: number;
  initialComments: Comment[];
  averageRating: number;
}

export default function ProductReviews({ productId, initialComments, averageRating }: ProductReviewsProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const isAuthenticated = status === "authenticated";

  // محاسبه میانگین امتیاز با بررسی NaN
  const calculatedAverageRating = (() => {
    if (comments.length > 0) {
      const sum = comments.reduce((total, comment) => total + (comment.rating || 0), 0);
      const avg = sum / comments.length;
      return isNaN(avg) ? 0 : avg;
    }
    const avg = averageRating || 0;
    return isNaN(avg) ? 0 : avg;
  })();

  // تابع دریافت توکن CSRF
  const getCsrfToken = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/csrf", { cache: "no-store" });
      const data = await res.json();
      return data.token;
    } catch (error) {
      console.error("Failed to fetch CSRF token:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      router.push("/auth/signin");
      return;
    }
    
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
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        alert("خطا در دریافت توکن امنیتی");
        return;
      }
      
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          productId,
          rating,
          content,
        }),
      });
      
      if (res.ok) {
        const newComment = await res.json();
        setComments([newComment, ...comments]);
        setRating(0);
        setContent("");
        alert("نظر شما با موفقیت ثبت شد و پس از تأیید نمایش داده می‌شود");
      } else {
        const error = await res.json();
        alert(error.error || "خطا در ثبت نظر");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  };

  // تابع ایمن برای نمایش تاریخ
  const formatDate = (date: Date | string) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "تاریخ نامعتبر";
      return d.toLocaleDateString("fa-IR");
    } catch {
      return "تاریخ نامعتبر";
    }
  };

  // ✅ تابع ایمن برای ساخت key (بدون استفاده از Date.now یا توابع غیرخالص)
  const getSafeKey = (comment: Comment, index: number): string => {
    if (comment.id && comment.id !== 0) {
      return `comment-${comment.id}`;
    }
    // در حالت fallback، از index استفاده می‌کنیم (که در لیست‌های استاتیک یا موقت قابل قبول است)
    return `comment-fallback-${index}`;
  };

  return (
    <div className="space-y-8">
      
      {/* نمایش میانگین امتیازات - اصلاح شده */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-violet-400">
              {calculatedAverageRating.toFixed(1)}
            </div>
            <div className="text-sm text-zinc-500 mt-1">از 5</div>
          </div>
          <div className="flex-1">
            <StarRating rating={calculatedAverageRating} />
            <div className="text-sm text-zinc-500 mt-2">
              {comments.length} نظر کاربران
            </div>
          </div>
        </div>
      </div>

      {/* فرم ثبت نظر */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h3 className="text-xl font-semibold mb-4">ثبت نظر شما</h3>
        
        {!isAuthenticated ? (
          <div className="text-center py-6">
            <p className="text-zinc-400 mb-4">برای ثبت نظر ابتدا وارد حساب کاربری خود شوید</p>
            <Link
              href="/auth/signin"
              className="inline-block px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors"
            >
              ورود به حساب
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">امتیاز شما</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className={`text-2xl transition-colors ${
                      star <= (hoverRating || rating)
                        ? "text-yellow-400"
                        : "text-zinc-600 hover:text-yellow-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-sm text-zinc-500 mr-2">
                  {rating > 0 ? `امتیاز ${rating} از 5` : "امتیاز دهید"}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-zinc-400 mb-2">نظر شما</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full p-4 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none transition resize-none"
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
        )}
      </div>

      {/* لیست نظرات - با key ایمن */}
      {comments.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center text-zinc-500">
          هنوز نظری برای این محصول ثبت نشده است. اولین نفری باشید که نظر می‌دهید!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment, idx) => (
            <div key={getSafeKey(comment, idx)} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 transition-all hover:bg-white/10">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold">{comment.userName || "کاربر"}</p>
                  <div className="mt-1">
                    <StarRating rating={comment.rating || 0} />
                  </div>
                </div>
                <span className="text-xs text-zinc-500">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed">{comment.content || ""}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}