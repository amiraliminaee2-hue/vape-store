export const dynamic = 'force-dynamic';
import { Metadata } from "next";
import { getPrisma } from "@/lib/prisma";
import Navbar from "../components/layout/Navbar";
import GlobeHero from "../components/sections/GlobeHero";
import Hero from "../components/sections/Hero";
import Footer from "../components/layout/Footer";
import ProductSlider from "../components/sections/ProductSlider";

async function getSettings() {
  const prisma = await getPrisma();
  const settings = await prisma.setting.findMany();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });
  return settingsMap;
}

async function getProducts() {
  const prisma = await getPrisma();
  const [
    discounted,
    bestSelling,
    featured,
    permanent,
    disposable,
    packs,
    girls,
    liquids,
  ] = await Promise.all([
    // ✅ فقط محصولات تخفیف‌دار (discountPercent > 0)
    prisma.product.findMany({
      where: { isActive: true, discountPercent: { gt: 0 } },
      take: 20,
      orderBy: { discountPercent: "desc" },
    }),
    
    // ✅ پرفروش‌ترین محصولات (بر اساس تعداد سفارش) + مدیریت دستی
    prisma.product.findMany({
      where: { isActive: true, showInBestSelling: true },
      take: 20,
      orderBy: {
        orderItems: {
          _count: "desc",
        },
      },
    }),
    
    // ✅ بهترین‌های فروشگاه (مدیریت دستی در ادمین)
    prisma.product.findMany({
      where: { isActive: true, showInFeatured: true },
      take: 20,
    }),
    
    // ⚡ پاد دائمی (مدیریت دستی)
    prisma.product.findMany({
      where: { isActive: true, showInPermanent: true },
      take: 20,
    }),
    
    // 🔄 یکبار مصرف (مدیریت دستی)
    prisma.product.findMany({
      where: { isActive: true, showInDisposable: true },
      take: 20,
    }),
    
    // 📦 پک‌ها (مدیریت دستی)
    prisma.product.findMany({
      where: { isActive: true, showInPacks: true },
      take: 20,
    }),
    
    // 💖 محصولات دخترونه (مدیریت دستی)
    prisma.product.findMany({
      where: { isActive: true, showInGirls: true },
      take: 20,
    }),
    
    // 🧪 لیکوئیدها و سالت‌ها (مدیریت دستی)
    prisma.product.findMany({
      where: { isActive: true, showInLiquids: true },
      take: 20,
    }),
  ]);

  return {
    discounted,
    bestSelling,
    featured,
    permanent,
    disposable,
    packs,
    girls,
    liquids,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://padbushehr.ir";

  return {
    title: settings.meta_title || "پاد بوشهر | فروشگاه تخصصی ویپ و پاد",
    description: settings.meta_description || "فروشگاه تخصصی ویپ، پاد، لیکوئید و لوازم جانبی با بهترین کیفیت و قیمت مناسب.",
    keywords: settings.meta_keywords?.split(",") || [
      "ویپ", "پاد", "لیکوئید", "خرید ویپ", "پاد بوشهر",
    ],
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      url: baseUrl,
      siteName: "پاد بوشهر",
      title: settings.meta_title || "پاد بوشهر | فروشگاه تخصصی ویپ و پاد",
      description: settings.meta_description || "فروشگاه تخصصی ویپ، پاد، لیکوئید و لوازم جانبی با بهترین کیفیت و قیمت مناسب.",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "پاد بوشهر",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.meta_title || "پاد بوشهر | فروشگاه تخصصی ویپ و پاد",
      description: settings.meta_description || "فروشگاه تخصصی ویپ، پاد، لیکوئید و لوازم جانبی با بهترین کیفیت و قیمت مناسب.",
      images: ["/og-image.png"],
    },
  };
}

export default async function Home() {
  const products = await getProducts();

  return (
    <>
      <Navbar />

      {/* بخش‌ها - ریسپانسیو با spacing مناسب برای موبایل */}
      <div className="space-y-0 md:space-y-0">
        <GlobeHero />
        <Hero />
      </div>

      {/* اسلایدرها - با فاصله مناسب برای موبایل */}
      <div className="space-y-8 md:space-y-12 lg:space-y-16">
        <ProductSlider title="🔥 تخفیف‌های ویژه" products={products.discounted} />
        <ProductSlider title="🏆 پرفروش‌ترین محصولات" products={products.bestSelling} />
        <ProductSlider title="⭐ بهترین‌های فروشگاه" products={products.featured} />
        <ProductSlider title="🧪 لیکوئیدها و سالت‌ها" products={products.liquids} />
        <ProductSlider title="⚡ پادهای دائمی" products={products.permanent} />
        <ProductSlider title="🔄 یکبار مصرف‌ها" products={products.disposable} />
        <ProductSlider title="📦 پک‌های ویژه" products={products.packs} />
        <ProductSlider title="💖 محصولات دخترونه" products={products.girls} />
      </div>

      <Footer />
    </>
  );
}