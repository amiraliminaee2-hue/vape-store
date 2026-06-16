"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PhoneSignInPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // اعتبارسنجی شماره تلفن
    const phoneRegex = /^09[0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      setError("شماره تلفن باید با 09 شروع شود و 11 رقم باشد");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        // ذخیره شماره تلفن در sessionStorage برای استفاده در صفحه تأیید
        sessionStorage.setItem("verifyPhone", phone);
        // هدایت به صفحه تأیید کد بعد از 1.5 ثانیه
        setTimeout(() => {
          router.push(`/auth/otp-verify?phone=${encodeURIComponent(phone)}`);
        }, 1500);
      } else {
        setError(data.error || "خطا در ارسال کد تأیید");
      }
    } catch (error) {
      console.error("Phone signin error:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-10">
      <div className="max-w-md w-full rounded-3xl border border-white/10 p-6 sm:p-8 bg-white/[0.03]">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold">ورود</h1>
          <p className="mt-2 text-zinc-500 text-sm sm:text-base">
            وارد کردن شماره تلفن
          </p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">کد تأیید ارسال شد</h2>
            <p className="text-zinc-400 text-sm">
              کد تأیید به شماره {phone} ارسال شد.
              <br />
              در حال انتقال به صفحه تأیید...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                شماره تلفن
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09123456789"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none transition-colors text-base"
                autoComplete="off"
                disabled={loading}
              />
              <p className="text-xs text-zinc-500 mt-1">
                کد تأیید به این شماره ارسال خواهد شد
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  در حال ارسال...
                </span>
              ) : (
                "ارسال کد تأیید"
              )}
            </button>

            <div className="text-center pt-4">
              <Link
                href="/auth/signin"
                className="text-sm text-zinc-500 hover:text-violet-400 transition-colors"
              >
                ← بازگشت به صفحه ورود
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}