import { Metadata } from "next";

export const metadata: Metadata = {
  title: "فروشگاه",
  description:
    "تمامی محصولات ویپ، پاد، لیکوئید و لوازم جانبی را در فروشگاه ما پیدا کنید. فیلتر بر اساس دسته‌بندی و مرتب‌سازی بر اساس قیمت.",
  openGraph: {
    title: "فروشگاه | ویپ استور",
    description:
      "تمامی محصولات ویپ، پاد، لیکوئید و لوازم جانبی را در فروشگاه ما پیدا کنید.",
    type: "website",
    locale: "fa_IR",
    siteName: "ویپ استور",
  },
  twitter: {
    card: "summary_large_image",
    title: "فروشگاه | ویپ استور",
    description:
      "تمامی محصولات ویپ، پاد، لیکوئید و لوازم جانبی را در فروشگاه ما پیدا کنید.",
  },
  alternates: {
    canonical: "https://vapestore.ir/shop",
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}