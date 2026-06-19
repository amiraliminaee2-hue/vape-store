"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Settings = Record<string, string>;

export default function Footer() {
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-white/10 py-8 md:py-12 mt-10 md:mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* گرید ریسپانسیو */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12 mb-8 md:mb-10 text-right">

          {/* درباره ما */}
          <div className="text-center sm:text-right">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">
              درباره ما
            </h3>
            <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
              {settings["about_us_text"] || "پاد بوشهر | فروشگاه تخصصی ویپ و پاد"}
            </p>
          </div>

          {/* اطلاعات تماس */}
          <div className="text-center sm:text-right">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">
              اطلاعات تماس
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-500">
              <li className="flex items-center justify-center sm:justify-start gap-2">
                <span>📞</span>
                <span>{settings["site_phone"] || "۰۷۷-۳۲۳۵۹۶۷۸"}</span>
              </li>
              <li className="flex items-center justify-center sm:justify-start gap-2">
                <span>✉️</span>
                <span className="break-all">{settings["site_email"] || "info@padbushehr.ir"}</span>
              </li>
              <li className="flex items-start justify-center sm:justify-start gap-2">
                <span>📍</span>
                <span className="break-words">{settings["site_address"] || "بوشهر، خیابان انقلاب"}</span>
              </li>
              <li className="flex items-center justify-center sm:justify-start gap-2">
                <span>🕒</span>
                <span>{settings["working_hours"] || "شنبه تا پنجشنبه ۱۰ صبح تا ۸ شب"}</span>
              </li>
            </ul>
          </div>

          {/* دسترسی سریع */}
          <div className="text-center sm:text-right">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">
              دسترسی سریع
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/shop" className="text-zinc-500 hover:text-violet-400 transition-colors">
                  فروشگاه
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-zinc-500 hover:text-violet-400 transition-colors">
                  درباره ما
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-zinc-500 hover:text-violet-400 transition-colors">
                  تماس با ما
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-zinc-500 hover:text-violet-400 transition-colors">
                  سوالات متداول
                </Link>
              </li>
            </ul>
          </div>

          {/* شبکه‌های اجتماعی */}
          <div className="text-center sm:text-right">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-white">
              شبکه‌های اجتماعی
            </h3>
            <div className="flex justify-center sm:justify-start gap-3 flex-wrap">
              {settings["instagram_url"] && (
                <a
                  href={settings["instagram_url"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-gradient-to-tr hover:from-pink-500 hover:to-orange-500 transition-all text-lg sm:text-xl hover:scale-110"
                  aria-label="اینستاگرام"
                >
                  📸
                </a>
              )}
              {settings["telegram_url"] && (
                <a
                  href={settings["telegram_url"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-500/20 hover:text-blue-400 transition-all text-lg sm:text-xl hover:scale-110"
                  aria-label="تلگرام"
                >
                  ✈️
                </a>
              )}
              {settings["rubika_url"] && (
                <a
                  href={settings["rubika_url"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-purple-500/20 hover:text-purple-400 transition-all text-lg sm:text-xl hover:scale-110"
                  aria-label="روبیکا"
                >
                  💬
                </a>
              )}
              {settings["whatsapp_url"] && (
                <a
                  href={settings["whatsapp_url"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-green-500/20 hover:text-green-400 transition-all text-lg sm:text-xl hover:scale-110"
                  aria-label="واتساپ"
                >
                  📱
                </a>
              )}
            </div>
          </div>
        </div>

        {/* کپی‌رایت */}
        <div className="pt-6 md:pt-8 border-t border-white/10 text-center text-zinc-500 text-xs sm:text-sm">
          {settings["footer_text"] || "© ۱۴۰۳ پاد بوشهر. تمامی حقوق محفوظ است."}
        </div>
      </div>
    </footer>
  );
}