import { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "درباره ما | پاد بوشهر",
  description: "آشنایی با فروشگاه تخصصی ویپ و پاد بوشهر",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#050505] text-white pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
            درباره ما
          </h1>
          
          <div className="space-y-8 text-zinc-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-violet-400">معرفی فروشگاه پاد بوشهر</h2>
              <p>
                فروشگاه تخصصی ویپ و پاد بوشهر با هدف ارائه بهترین محصولات اورجینال و باکیفیت در زمینه ویپ، پاد، لیکوئید و لوازم جانبی آغاز به کار کرده است.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-violet-400">چرا پاد بوشهر؟</h2>
              <ul className="list-disc list-inside space-y-2 mr-4">
                <li>✅ تضمین اصالت کالا</li>
                <li>✅ ارسال سریع به سراسر کشور</li>
                <li>✅ پشتیبانی ۲۴ ساعته</li>
                <li>✅ قیمت‌های رقابتی</li>
                <li>✅ مشاوره رایگان قبل از خرید</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-violet-400">چشم‌انداز ما</h2>
              <p>
                ما در پاد بوشهر تلاش می‌کنیم تا با ارائه بهترین خدمات و محصولات، تجربه خریدی لذت‌بخش و مطمئن را برای شما عزیزان فراهم کنیم.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}