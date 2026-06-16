"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BanUserButtonProps {
  userId: string;
  userName: string;
  isBanned: boolean;
  banExpiry?: string | null;
}

const DURATIONS = [
  { value: "8h", label: "۸ ساعت" },
  { value: "12h", label: "۱۲ ساعت" },
  { value: "24h", label: "۲۴ ساعت" },
  { value: "1w", label: "۱ هفته" },
  { value: "1m", label: "۱ ماه" },
  { value: "permanent", label: "همیشگی" },
];

export default function BanUserButton({ userId, userName, isBanned, banExpiry }: BanUserButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [duration, setDuration] = useState("24h");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration, reason }),
      });
      
      if (res.ok) {
        alert(`کاربر ${userName} با موفقیت بن شد`);
        setShowModal(false);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "خطا در بن کردن کاربر");
      }
    } catch (error) {
      console.error("Ban error:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async () => {
    if (!confirm(`آیا از لغو بن کاربر ${userName} مطمئن هستید؟`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        alert(`بن کاربر ${userName} لغو شد`);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "خطا در لغو بن");
      }
    } catch (error) {
      console.error("Unban error:", error);
      alert("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  if (isBanned) {
    const expiryText = banExpiry 
      ? `تا ${new Date(banExpiry).toLocaleDateString("fa-IR")}`
      : "همیشگی";
    
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded-full">
          بن شده ({expiryText})
        </span>
        <button
          onClick={handleUnban}
          disabled={loading}
          className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "لغو بن"}
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm transition-colors"
      >
        بن کردن
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl border border-white/10 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">بن کردن کاربر</h3>
            <p className="text-zinc-400 mb-4">
              کاربر: <span className="text-white">{userName}</span>
            </p>
            
            <div className="mb-4">
              <label className="block text-sm text-zinc-400 mb-2">مدت زمان بن</label>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((dur) => (
                  <button
                    key={dur.value}
                    type="button"
                    onClick={() => setDuration(dur.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      duration === dur.value
                        ? "bg-violet-600 text-white"
                        : "bg-white/10 text-zinc-300 hover:bg-white/20"
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm text-zinc-400 mb-2">دلیل بن (اختیاری)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none text-sm"
                placeholder="دلیل بن کردن کاربر..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleBan}
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {loading ? "در حال بن..." : "تأیید بن"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}