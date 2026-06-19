"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function OtpVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get("phone");
  
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // دریافت شماره تلفن از sessionStorage یا پارامترهای URL
  useEffect(() => {
    const storedPhone = sessionStorage.getItem("verifyPhone");
    if (storedPhone) {
      setPhone(storedPhone);
    } else if (phoneParam) {
      setPhone(phoneParam);
    } else {
      // اگر شماره تلفن وجود نداشت، برگرد به صفحه اول
      router.push("/auth/phone-signin");
    }
  }, [phoneParam, router]);

  // تایمر برای ارسال مجدد کد
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [countdown]);

  const handleResendCode = async () => {
    if (!canResend || !phone) return;
    
    setCanResend(false);
    setCountdown(120); // 2 دقیقه
    setError("");

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "خطا در ارسال مجدد کد");
        setCanResend(true);
        setCountdown(0);
      } else {
        // در محیط توسعه، کد را در کنسول لاگ کن
        if (data.devCode) {
          console.log("📱 توسعه: کد تأیید:", data.devCode);
        }
      }
    } catch (error) {
      console.error("Resend error:", error);
      setError("خطا در ارسال مجدد کد");
      setCanResend(true);
      setCountdown(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!code || code.length !== 6) {
      setError("لطفاً کد ۶ رقمی را وارد کنید");
      setLoading(false);
      return;
    }

    try {
      // تأیید کد با API
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "کد تأیید نامعتبر است");
        setLoading(false);
        return;
      }

      // ورود با استفاده از next-auth (credentials)
      const signInRes = await signIn("credentials", {
        phone: data.user.phone,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("خطا در ورود به حساب کاربری");
        setLoading(false);
        return;
      }

      // پاک کردن شماره تلفن ذخیره شده
      sessionStorage.removeItem("verifyPhone");
      
      // هدایت به داشبورد
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("OTP verify error:", error);
      setError("خطا در تأیید کد");
      setLoading(false);
    }
  };

  // ورود خودکار با کد توسعه (فقط در محیط توسعه)
  const fillDevCode = (devCode: string) => {
    setCode(devCode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-10">
      <div className="max-w-md w-full rounded-3xl border border-white/10 p-6 sm:p-8 bg-white/[0.03]">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold">تأیید کد</h1>
          <p className="mt-2 text-zinc-500 text-sm sm:text-base">
            کد ارسال شده به شماره {phone}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              کد تأیید ۶ رقمی
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="------"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500 outline-none transition-colors text-center text-2xl tracking-widest"
              autoComplete="off"
              disabled={loading}
              maxLength={6}
            />
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
                در حال تأیید...
              </span>
            ) : (
              "تأیید و ورود"
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={!canResend}
              className={`text-sm transition-colors ${
                canResend
                  ? "text-violet-400 hover:text-violet-300"
                  : "text-zinc-500 cursor-not-allowed"
              }`}
            >
              {countdown > 0
                ? `ارسال مجدد کد (${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, "0")})`
                : "ارسال مجدد کد"}
            </button>
          </div>

          <div className="text-center pt-4">
            <Link
              href="/auth/phone-signin"
              className="text-sm text-zinc-500 hover:text-violet-400 transition-colors"
            >
              ← بازگشت به مرحله قبل
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}