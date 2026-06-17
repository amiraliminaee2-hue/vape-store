"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Settings {
  site_phone: string;
  site_email: string;
  site_address: string;
  working_hours: string;
  instagram_url: string;
  telegram_url: string;
  rubika_url: string;
  whatsapp_url: string;
  about_us_text: string;
  footer_text: string;
  header_text: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  cart2cart_telegram: string;
  cart2cart_rubika: string;
  cart2cart_phone: string;
  cart2cart_card_number: string;
  cart2cart_bank_name: string;
  cart2cart_account_name: string;
}

const defaultSettings: Settings = {
  site_phone: "",
  site_email: "",
  site_address: "",
  working_hours: "",
  instagram_url: "",
  telegram_url: "",
  rubika_url: "",
  whatsapp_url: "",
  about_us_text: "",
  footer_text: "",
  header_text: "",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  cart2cart_telegram: "",
  cart2cart_rubika: "",
  cart2cart_phone: "",
  cart2cart_card_number: "",
  cart2cart_bank_name: "",
  cart2cart_account_name: "",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const router = useRouter();

  const fetchSettings = async (): Promise<void> => {
    try {
      const res = await fetch("/api/settings");
      const data: Partial<Settings> = await res.json();
      setSettings((prev) => ({ ...prev, ...data }));
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: keyof Settings, value: string): void => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSetting = async (key: string, value: string): Promise<void> => {
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const promises = Object.entries(settings).map(([key, value]) =>
        saveSetting(key, value)
      );
      await Promise.all(promises);

      setMessage("تنظیمات با موفقیت ذخیره شد");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-10">
        <div className="text-center">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">تنظیمات سایت</h1>
          {message && (
            <div className={`px-4 py-2 rounded-xl ${message.includes("موفقیت") ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
              {message}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Contact Information */}
          <div className="rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              📞 اطلاعات تماس
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">شماره تماس</label>
                <input
                  type="text"
                  value={settings.site_phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("site_phone", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="۰۲۱-۱۲۳۴۵۶۷۸"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">ایمیل</label>
                <input
                  type="email"
                  value={settings.site_email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("site_email", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="info@site.com"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">آدرس</label>
                <input
                  type="text"
                  value={settings.site_address}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("site_address", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="تهران، خیابان ..."
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">ساعات کاری</label>
                <input
                  type="text"
                  value={settings.working_hours}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("working_hours", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="شنبه تا پنجشنبه ۱۰ تا ۲۰"
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              📱 شبکه‌های اجتماعی
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">اینستاگرام</label>
                <input
                  type="text"
                  value={settings.instagram_url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("instagram_url", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">تلگرام</label>
                <input
                  type="text"
                  value={settings.telegram_url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("telegram_url", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="https://t.me/..."
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">روبیکا</label>
                <input
                  type="text"
                  value={settings.rubika_url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("rubika_url", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="https://rubika.ir/..."
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">واتساپ</label>
                <input
                  type="text"
                  value={settings.whatsapp_url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("whatsapp_url", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="https://wa.me/..."
                />
              </div>
            </div>
          </div>

          {/* تنظیمات کارت به کارت */}
          <div className="rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              💳 تنظیمات پرداخت کارت به کارت
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">لینک تلگرام پشتیبانی</label>
                <input
                  type="text"
                  value={settings.cart2cart_telegram}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("cart2cart_telegram", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="https://t.me/username"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">لینک روبیکا پشتیبانی</label>
                <input
                  type="text"
                  value={settings.cart2cart_rubika}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("cart2cart_rubika", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="https://rubika.ir/username"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">شماره تماس پشتیبانی</label>
                <input
                  type="text"
                  value={settings.cart2cart_phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("cart2cart_phone", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="09123456789"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">شماره کارت</label>
                <input
                  type="text"
                  value={settings.cart2cart_card_number}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("cart2cart_card_number", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="6037-****-****-****"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">نام بانک</label>
                <input
                  type="text"
                  value={settings.cart2cart_bank_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("cart2cart_bank_name", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="بانک ملی"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">نام صاحب حساب</label>
                <input
                  type="text"
                  value={settings.cart2cart_account_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("cart2cart_account_name", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="فروشگاه ویپ"
                />
              </div>
            </div>
          </div>

          {/* Site Texts */}
          <div className="rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              📝 متن‌های سایت
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">متن هدر</label>
                <input
                  type="text"
                  value={settings.header_text}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("header_text", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="متن هدر سایت..."
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">متن فوتر</label>
                <textarea
                  value={settings.footer_text}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("footer_text", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="متن فوتر سایت..."
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">درباره ما</label>
                <textarea
                  value={settings.about_us_text}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("about_us_text", e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="متن درباره ما..."
                />
              </div>
            </div>
          </div>

          {/* SEO Settings */}
          <div className="rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              🔍 تنظیمات سئو
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">عنوان سایت (Meta Title)</label>
                <input
                  type="text"
                  value={settings.meta_title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("meta_title", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="عنوان سایت برای سئو..."
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">توضیحات متا (Meta Description)</label>
                <textarea
                  value={settings.meta_description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("meta_description", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="توضیحات سایت برای سئو..."
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">کلمات کلیدی (Meta Keywords)</label>
                <input
                  type="text"
                  value={settings.meta_keywords}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("meta_keywords", e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500/50"
                  placeholder="ویپ, پاد, لیکوئید, ..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}