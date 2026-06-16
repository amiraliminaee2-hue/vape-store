"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setSending(false);
    setSent(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#050505] text-white pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
            تماس با ما
          </h1>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold mb-4 text-violet-400">اطلاعات تماس</h2>
                <div className="space-y-3 text-zinc-300">
                  <p className="flex items-center gap-3">📞 ۰۷۷-۳۳۳۳۴۵۶۷</p>
                  <p className="flex items-center gap-3">📱 ۰۹۱۷۷۷۱۲۳۴۵</p>
                  <p className="flex items-center gap-3">✉️ info@padbushehr.ir</p>
                  <p className="flex items-start gap-3">📍 بوشهر، خیابان انقلاب، پلاک ۱۲۳</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold mb-4 text-violet-400">ساعات کاری</h2>
                <div className="space-y-2 text-zinc-300">
                  <p>شنبه تا چهارشنبه: ۱۰ صبح تا ۸ شب</p>
                  <p>پنجشنبه: ۱۰ صبح تا ۶ عصر</p>
                  <p>جمعه: تعطیل</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4 text-violet-400">ارسال پیام</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="نام و نام خانوادگی"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ایمیل"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="موضوع"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none transition"
                    required
                  />
                </div>
                <div>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="متن پیام"
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 focus:border-violet-500 outline-none transition resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors font-medium disabled:opacity-50"
                >
                  {sending ? "در حال ارسال..." : "ارسال پیام"}
                </button>
                {sent && (
                  <p className="text-green-400 text-center text-sm">پیام شما با موفقیت ارسال شد ✅</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}