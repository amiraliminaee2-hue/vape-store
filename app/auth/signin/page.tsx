"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const router = useRouter();

  useEffect(() => {
    // هدایت خودکار به صفحه ورود با شماره همراه
    router.push("/auth/phone-signin");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-10">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-zinc-400">در حال انتقال...</p>
      </div>
    </div>
  );
}