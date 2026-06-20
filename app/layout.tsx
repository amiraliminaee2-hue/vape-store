export const dynamic = 'force-dynamic';
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import BackgroundGrid from "../components/layout/BackgroundGrid";
import ClientLayoutWrapper from "../components/layout/ClientLayoutWrapper";
import AuthProvider from "./providers/AuthProviders";
import BanCheck from "@/components/auth/BanCheck";
import Footer from "@/components/layout/Footer"; // ✅ اضافه کردن Footer

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://padbushehr.ir"),
  title: {
    default: "پاد بوشهر | فروشگاه تخصصی ویپ و پاد",
    template: "%s | پاد بوشهر",
  },
  description: "فروشگاه تخصصی ویپ، پاد، لیکوئید و لوازم جانبی با بهترین کیفیت و قیمت مناسب در بوشهر",
  keywords: ["ویپ", "پاد", "لیکوئید", "خرید ویپ", "پاد بوشهر", "فروشگاه ویپ"],
  authors: [{ name: "پاد بوشهر" }],
  creator: "پاد بوشهر",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "پاد بوشهر | فروشگاه تخصصی ویپ و پاد",
    description: "فروشگاه تخصصی ویپ، پاد، لیکوئید و لوازم جانبی با بهترین کیفیت و قیمت مناسب",
    url: "https://padbushehr.ir",
    siteName: "پاد بوشهر",
    locale: "fa_IR",
    type: "website",
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
    title: "پاد بوشهر | فروشگاه تخصصی ویپ و پاد",
    description: "فروشگاه تخصصی ویپ، پاد، لیکوئید و لوازم جانبی",
    images: ["/og-image.png"],
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#050505" />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-vazirmatn), Arial, sans-serif" }}
      >
        <AuthProvider>
          <BackgroundGrid />
          <BanCheck>
            <ClientLayoutWrapper />
            {children}
          </BanCheck>
          <Footer /> {/* ✅ اضافه کردن Footer در layout */}
        </AuthProvider>
      </body>
    </html>
  );
}