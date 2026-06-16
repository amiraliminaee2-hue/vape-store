"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import PriceWithDiscount from "../ui/PriceWithDiscount";

interface Product {
  id: number;
  title: string;
  slug: string;
  price: number;
  discountPercent: number;
  images: string[];
}

interface ProductSliderProps {
  title: string;
  products: Product[];
}

export default function ProductSlider({ title, products }: ProductSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = 280;
      sliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-12 border-b border-white/10">
      <div className="container mx-auto px-4 sm:px-6">
        
        {/* هدر اسلایدر - ریسپانسیو */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center sm:text-right">
            {title}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-base sm:text-xl"
              aria-label="اسکرول به راست"
            >
              →
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-base sm:text-xl"
              aria-label="اسکرول به چپ"
            >
              ←
            </button>
          </div>
        </div>

        {/* اسلایدر - کارت‌های ریسپانسیو */}
        <div
          ref={sliderRef}
          className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto scroll-smooth pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="flex-shrink-0 w-[160px] xs:w-[180px] sm:w-[200px] md:w-[220px] lg:w-[250px] group"
            >
              <div className="rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 overflow-hidden hover:border-violet-500/50 hover:scale-105 transition-all duration-300">
                
                {/* تصویر */}
                <div className="aspect-square relative bg-zinc-900/50">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 640px) 160px, (max-width: 768px) 180px, (max-width: 1024px) 200px, 250px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl">
                      🖼️
                    </div>
                  )}
                </div>

                {/* اطلاعات */}
                <div className="p-2 sm:p-3 text-center">
                  <h3 className="text-xs sm:text-sm font-semibold line-clamp-2 group-hover:text-violet-400 transition">
                    {product.title}
                  </h3>
                  <div className="mt-1 sm:mt-2">
                    <PriceWithDiscount
                      price={product.price}
                      discountPercent={product.discountPercent}
                      className="space-y-0.5"
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}