"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Comment {
  id: number;
  userId: string;
  userName: string;
  content: string;
  rating: number;
  createdAt: string;
}

interface CommentListProps {
  productId: number;
  refreshTrigger?: number;
  onCommentDeleted?: () => void;
}

export default function CommentList({ productId, refreshTrigger = 0, onCommentDeleted }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { data: session } = useSession();

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?productId=${productId}`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments, refreshTrigger]);

  const handleDelete = async (commentId: number) => {
    if (!confirm("آیا از حذف این نظر مطمئن هستید؟")) return;

    setDeletingId(commentId);
    try {
      // Get CSRF token first
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();

      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
      });

      if (res.ok) {
        // Remove comment from list
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        if (onCommentDeleted) onCommentDeleted();
      } else {
        const data = await res.json();
        alert(data.error || "خطا در حذف نظر");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("خطا در حذف نظر");
    } finally {
      setDeletingId(null);
    }
  };

  const averageRating = comments.length > 0
    ? comments.reduce((acc, c) => acc + c.rating, 0) / comments.length
    : 0;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < rating ? "text-yellow-400" : "text-zinc-600"}>★</span>
    ));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-28 rounded-3xl border border-white/5 bg-white/[0.02] animate-pulse" />
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center text-zinc-500">
        هنوز نظری برای این محصول ثبت نشده است. اولین نفر باشید!
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex">{renderStars(Math.round(averageRating))}</div>
        <span className="text-zinc-400 text-sm">({comments.length} نظر) — میانگین {averageRating.toFixed(1)} از ۵</span>
      </div>
      {comments.map((comment) => (
        <div key={comment.id} className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{comment.userName}</span>
                <div className="flex">{renderStars(comment.rating)}</div>
              </div>
              <p className="mt-1 text-xs text-zinc-600">
                {new Date(comment.createdAt).toLocaleDateString("fa-IR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            
            {/* Delete button - only show for comment owner */}
            {session?.user?.id === comment.userId && (
              <button
                onClick={() => handleDelete(comment.id)}
                disabled={deletingId === comment.id}
                className="mr-4 p-2 rounded-full text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all disabled:opacity-50"
                title="حذف نظر"
              >
                {deletingId === comment.id ? (
                  <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
          <p className="mt-4 text-zinc-300 leading-7">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}