"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SellerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    storeName: "",
    slug: "",
    description: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // اگر کاربر لاگین نیست، به صفحه ورود هدایت شود
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-zinc-400">در حال بارگذاری...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  // تبدیل متن فارسی به slug
  const convertToSlug = (text: string): string => {
    const persianMap: Record<string, string> = {
      'ا': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's',
      'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd',
      'ذ': 'z', 'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's',
      'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z',
      'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'gh', 'ک': 'k',
      'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'v',
      'ه': 'h', 'ی': 'y', ' ': '-', '_': '-',
    };
    
    let result = text.toLowerCase().trim();
    for (const [persian, english] of Object.entries(persianMap)) {
      result = result.replace(new RegExp(persian, 'g'), english);
    }
    result = result.replace(/[^a-z0-9-]/g, '');
    result = result.replace(/-+/g, '-');
    result = result.replace(/^-|-$/g, '');
    return result || "store";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    if (name === "storeName") {
      const generatedSlug = convertToSlug(value).slice(0, 50);
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.storeName.trim()) {
      newErrors.storeName = "نام فروشگاه الزامی است";
    }
    if (!formData.slug.trim()) {
      newErrors.slug = "slug الزامی است";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug = "slug نامعتبر است (فقط حروف کوچک انگلیسی، اعداد و خط تیره)";
    }
    if (!formData.description.trim()) {
      newErrors.description = "توضیحات فروشگاه الزامی است";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "شماره تماس الزامی است";
    } else if (!/^09[0-9]{9}$/.test(formData.phone.trim())) {
      newErrors.phone = "شماره تماس نامعتبر است (مثال: 09123456789)";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/sellers", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      // اگر پاسخ OK نبود، خطا بگیر
      if (!res.ok) {
        let errorMessage = "خطا در ثبت درخواست";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `خطا ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      
      if (data.success) {
        alert("درخواست شما با موفقیت ثبت شد. پس از تأیید مدیر، فروشگاه شما فعال می‌شود.");
        router.push("/");
      } else {
        alert(data.error || "خطا در ثبت درخواست");
      }
    } catch (error) {
      console.error("Error submitting seller request:", error);
      alert(error instanceof Error ? error.message : "خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0f] text-white pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            فروشنده شو
          </h1>
          <p className="mt-3 sm:mt-4 text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
            به خانواده بزرگ پاد بوشهر بپیوندید و فروشگاه خود را راه‌اندازی کنید
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/10 p-5 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            
            <div>
              <label className="block text-sm sm:text-base font-medium text-zinc-300 mb-1.5 sm:mb-2">
                نام فروشگاه <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                placeholder="مثال: فروشگاه ویپ بوشهر"
                className={`
                  w-full px-4 sm:px-5 py-3 sm:py-3.5
                  rounded-xl
                  bg-zinc-900/50
                  border
                  focus:outline-none
                  focus:ring-2 focus:ring-violet-500/50
                  transition-all
                  text-sm sm:text-base
                  ${errors.storeName ? "border-red-500" : "border-white/10 focus:border-violet-500"}
                `}
              />
              {errors.storeName && (
                <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.storeName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-zinc-300 mb-1.5 sm:mb-2">
                آدرس فروشگاه (slug) <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-zinc-500 mb-1.5">
                <span>padbushehr.ir/</span>
                <span className="text-violet-400 font-mono">{formData.slug || "store-name"}</span>
              </div>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="store-name"
                className={`
                  w-full px-4 sm:px-5 py-3 sm:py-3.5
                  rounded-xl
                  bg-zinc-900/50
                  border
                  focus:outline-none
                  focus:ring-2 focus:ring-violet-500/50
                  transition-all
                  font-mono text-sm sm:text-base
                  ${errors.slug ? "border-red-500" : "border-white/10 focus:border-violet-500"}
                `}
              />
              {errors.slug && (
                <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.slug}</p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                با تغییر نام فروشگاه، این قسمت به صورت خودکار پر می‌شود
              </p>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-zinc-300 mb-1.5 sm:mb-2">
                توضیحات فروشگاه <span className="text-red-400">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="درباره فروشگاه خود توضیح دهید..."
                className={`
                  w-full px-4 sm:px-5 py-3 sm:py-3.5
                  rounded-xl
                  bg-zinc-900/50
                  border
                  focus:outline-none
                  focus:ring-2 focus:ring-violet-500/50
                  transition-all
                  resize-none
                  text-sm sm:text-base
                  ${errors.description ? "border-red-500" : "border-white/10 focus:border-violet-500"}
                `}
              />
              {errors.description && (
                <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-zinc-300 mb-1.5 sm:mb-2">
                شماره تماس <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="09123456789"
                className={`
                  w-full px-4 sm:px-5 py-3 sm:py-3.5
                  rounded-xl
                  bg-zinc-900/50
                  border
                  focus:outline-none
                  focus:ring-2 focus:ring-violet-500/50
                  transition-all
                  text-sm sm:text-base
                  ${errors.phone ? "border-red-500" : "border-white/10 focus:border-violet-500"}
                `}
              />
              {errors.phone && (
                <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.phone}</p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                شماره تماس شما برای ارتباط با شما استفاده خواهد شد
              </p>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-zinc-300 mb-1.5 sm:mb-2">
                آدرس فروشگاه
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="تهران، خیابان ..."
                className="
                  w-full px-4 sm:px-5 py-3 sm:py-3.5
                  rounded-xl
                  bg-zinc-900/50
                  border border-white/10
                  focus:outline-none
                  focus:ring-2 focus:ring-violet-500/50
                  focus:border-violet-500
                  transition-all
                  text-sm sm:text-base
                "
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  py-3.5 sm:py-4
                  rounded-xl
                  bg-gradient-to-r from-violet-600 to-purple-600
                  hover:from-violet-500 hover:to-purple-500
                  text-white
                  font-semibold
                  text-base sm:text-lg
                  transition-all
                  duration-300
                  shadow-lg shadow-violet-500/25
                  hover:shadow-violet-500/40
                  hover:scale-[1.02]
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  disabled:hover:scale-100
                "
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    در حال ثبت درخواست...
                  </span>
                ) : (
                  "ثبت درخواست فروشندگی"
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="font-semibold text-sm sm:text-base">تأیید سریع</h3>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">بررسی درخواست در کمتر از ۴۸ ساعت</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">📦</div>
            <h3 className="font-semibold text-sm sm:text-base">ثبت نامحدود محصول</h3>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">بدون محدودیت در تعداد محصولات</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold text-sm sm:text-base">کمیسیون رقابتی</h3>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">دریافت سود فروش محصولات شما</p>
          </div>
        </div>
      </div>
    </main>
  );
}