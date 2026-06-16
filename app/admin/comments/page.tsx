"use client";

import { useEffect, useState } from "react";

interface Comment {
  id: number;
  userName: string;
  content: string;
  rating: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  product: {
    id: number;
    title: string;
  };
}

const statusLabels: Record<string, string> = {
  PENDING: "در انتظار تأیید",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-300",
  APPROVED: "bg-emerald-500/20 text-emerald-300",
  REJECTED: "bg-red-500/20 text-red-300",
};

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  const fetchComments = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/comments?status=${status}`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error("Fetch comments error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(filter);
  }, [filter]);

  const handleStatusChange = async (
    commentId: number,
    newStatus: "APPROVED" | "REJECTED"
  ) => {
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchComments(filter);
      } else {
        alert("خطا در تغییر وضعیت نظر");
      }
    } catch (error) {
      console.error("Update comment status error:", error);
      alert("خطا در تغییر وضعیت نظر");
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm("آیا از حذف این نظر مطمئن هستید؟")) return;

    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchComments(filter);
      } else {
        alert("خطا در حذف نظر");
      }
    } catch (error) {
      console.error("Delete comment error:", error);
      alert("خطا در حذف نظر");
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span
        key={i}
        className={i < rating ? "text-yellow-400" : "text-zinc-600"}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">مدیریت نظرات</h1>
        <p className="mt-2 text-zinc-500">{comments.length} نظر</p>
      </div>

      <div className="flex gap-3">
        {[
          { value: "PENDING", label: "در انتظار تأیید" },
          { value: "APPROVED", label: "تأیید شده" },
          { value: "REJECTED", label: "رد شده" },
          { value: "ALL", label: "همه" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`
              px-5 py-2.5
              rounded-full
              border
              font-medium
              text-sm
              transition-all duration-200
              ${
                filter === opt.value
                  ? "bg-white text-black border-white"
                  : "border-white/10 text-zinc-400 hover:border-white/30 hover:text-white"
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-3xl border border-white/5 bg-white/[0.02] animate-pulse"
            />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          هیچ نظری در این دسته وجود ندارد
        </div>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold">{comment.userName}</span>
                    <div className="flex">{renderStars(comment.rating)}</div>
                    <span
                      className={`
                        inline-flex px-3 py-1 rounded-full text-xs
                        ${statusColors[comment.status]}
                      `}
                    >
                      {statusLabels[comment.status]}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-zinc-500">
                    محصول:{" "}
                    <span className="text-violet-400">
                      {comment.product.title}
                    </span>
                  </p>

                  <p className="mt-3 text-zinc-300 leading-7">{comment.content}</p>

                  <p className="mt-2 text-xs text-zinc-600">
                    {new Date(comment.createdAt).toLocaleDateString("fa-IR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex gap-2 mr-4 flex-shrink-0">
                  {comment.status !== "APPROVED" && (
                    <button
                      onClick={() => handleStatusChange(comment.id, "APPROVED")}
                      className="
                        px-4 py-2
                        rounded-xl
                        bg-emerald-500/20
                        text-emerald-300
                        hover:bg-emerald-500/30
                        transition-colors
                        text-sm
                        font-medium
                      "
                    >
                      تأیید
                    </button>
                  )}

                  {comment.status !== "REJECTED" && (
                    <button
                      onClick={() => handleStatusChange(comment.id, "REJECTED")}
                      className="
                        px-4 py-2
                        rounded-xl
                        bg-orange-500/20
                        text-orange-300
                        hover:bg-orange-500/30
                        transition-colors
                        text-sm
                        font-medium
                      "
                    >
                      رد
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="
                      px-4 py-2
                      rounded-xl
                      bg-red-500/20
                      text-red-400
                      hover:bg-red-500/30
                      transition-colors
                      text-sm
                      font-medium
                    "
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}