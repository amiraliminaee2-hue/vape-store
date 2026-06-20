import { Metadata } from "next";

export const metadata: Metadata = {
  title: "فروشگاه",
  description:
    "تمامی محصولات ویپ، پاد، لیکوئید و لوازم جانبی را در فروشگاه ما پیدا کنید. فیلتر بر اساس دسته‌بندی و مرتب‌سازی بر اساس قیمت.",
  openGraph: {
    title: "فروشگاه | پاد بوشهر ",
    description:
      "تمامی محصولات ویپ، پاد، لیکوئید و لوازم جانبی را در فروشگاه ما پیدا کنید.",
    type: "website",
    locale: "fa_IR",
    siteName: "پاد بوشهر",
  },
  twitter: {
    card: "summary_large_image",
    title: "فروشگاه | پاد بوشهر ",
    description:
      "تمامی محصولات ویپ، پاد، لیکوئید و لوازم جانبی را در فروشگاه ما پیدا کنید.",
  },
  alternates: {
    canonical: "https://padbushehr.ir/shop",
  },
};

interface ShopLayoutProps {
  children: React.ReactNode;
}

export default function ShopLayout({ children }: ShopLayoutProps) {
  return <>{children}</>;
}