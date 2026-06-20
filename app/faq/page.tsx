"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
// ❌ حذف import Footer

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "آیا محصولات شما اصل هستند؟",
    answer: "بله، تمامی محصولات فروشگاه پاد بوشهر ۱۰۰٪ اصل و با ضمانت اصالت کالا ارائه می‌شوند.",
  },
  {
    question: "هزینه ارسال چقدر است؟",
    answer: "هزینه ارسال بر اساس وزن بسته و مقصد تعیین می‌شود. برای خریدهای بالای ۵۰۰ هزار تومان، ارسال رایگان است.",
  },
  {
    question: "مدت زمان ارسال چقدر است؟",
    answer: "سفارش‌ها در تهران ظرف ۲۴ ساعت و در شهرستان‌ها ۲ تا ۵ روز کاری ارسال می‌شوند.",
  },
  {
    question: "چگونه می‌توانم سفارش خود را پیگیری کنم؟",
    answer: "پس از ثبت سفارش، کد رهگیری برای شما پیامک می‌شود و می‌توانید از طریق سایت پست پیگیری کنید.",
  },
  {
    question: "آیا امکان مرجوعی کالا وجود دارد؟",
    answer: "در صورت وجود مشکل در کالا، تا ۷ روز کاری امکان بازگشت کالا وجود دارد.",
  },
  {
    question: "روش‌های پرداخت چیست؟",
    answer: "پرداخت از طریق درگاه بانکی آنلاین، کارت به کارت و واریز به حساب امکان‌پذیر است.",
  },
  {
    question: "آیا مشاوره رایگان دارید؟",
    answer: "بله، تیم پشتیبانی ما آماده پاسخگویی به سوالات شما از طریق تماس تلفنی، واتساپ و اینستاگرام است.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#050505] text-white pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
            سوالات متداول
          </h1>

          <div className="space-y-4">
            {faqs.map((faq: FAQItem, index: number) => (
              <div
                key={index}
                className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-right flex justify-between items-center hover:bg-white/10 transition-colors"
                >
                  <span className="font-semibold text-lg">{faq.question}</span>
                  <span className="text-2xl text-violet-400">
                    {openIndex === index ? "−" : "+"}
                  </span>
                </button>
                
                {openIndex === index && (
                  <div className="px-6 pb-4 text-zinc-400 leading-relaxed border-t border-white/10 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* بخش تماس اضافی */}
          <div className="mt-12 text-center">
            <p className="text-zinc-400 mb-4">
              سوال دیگری دارید؟ با ما در ارتباط باشید
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors"
            >
              تماس با ما
            </Link>
          </div>
        </div>
      </main>
      {/* ❌ حذف <Footer /> */}
    </>
  );
}