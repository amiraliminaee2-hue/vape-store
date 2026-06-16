"use client";

import Link from "next/link";
import Tilt from "react-parallax-tilt";
import { useState } from "react";

interface ProductCardProps {
  id: number;
  title: string;
  price: number;
  seller: string;
  stock?: number;
  isFeatured?: boolean;
  image?: string;
  images?: string[];
  averageRating?: number;
  reviewCount?: number;
}

// کامپوننت نمایش ستاره‌ها
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg key={`full-${i}`} className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      ))}
      
      {hasHalfStar && (
        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="halfGradient">
              <stop offset="50%" stopColor="#facc15"/>
              <stop offset="50%" stopColor="#3f3f46"/>
            </linearGradient>
          </defs>
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" fill="url(#halfGradient)"/>
        </svg>
      )}
      
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg key={`empty-${i}`} className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-600" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      ))}
    </div>
  );
}

export default function ProductCard({
  id,
  title,
  price,
  seller,
  stock = 0,
  isFeatured = false,
  images = [],
  averageRating = 0,
  reviewCount = 0,
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const productImage = images && images.length > 0 && !imgError ? images[0] : null;

  return (
    <Tilt
      glareEnable={true}
      glareMaxOpacity={0.2}
      glareColor="#a855f7"
      glarePosition="all"
      tiltMaxAngleX={8}
      tiltMaxAngleY={8}
      perspective={1000}
      scale={1.02}
      gyroscope={true}
      transitionSpeed={400}
      className="h-full"
    >
      <Link href={`/product/${id}`}>
        <div
          className="
            group
            relative
            overflow-hidden
            rounded-2xl sm:rounded-3xl
            border border-white/10
            bg-white/[0.03]
            backdrop-blur-xl
            transition-all duration-500
            hover:border-white/20
            hover:shadow-[0_0_40px_rgba(139,92,246,0.1)]
            cursor-pointer
            h-full
          "
        >
          {/* Featured Badge - ریسپانسیو */}
          {isFeatured && (
            <div
              className="
                absolute top-2 sm:top-4 right-2 sm:right-4
                z-10
                px-2 sm:px-3 py-0.5 sm:py-1
                rounded-full
                bg-violet-500/20
                border border-violet-500/30
                text-violet-300
                text-[10px] sm:text-xs font-medium
              "
            >
              پرفروش
            </div>
          )}

          {/* Stock Badge - ریسپانسیو */}
          {stock <= 5 && stock > 0 && (
            <div
              className="
                absolute top-2 sm:top-4 left-2 sm:left-4
                z-10
                px-2 sm:px-3 py-0.5 sm:py-1
                rounded-full
                bg-amber-500/20
                border border-amber-500/30
                text-amber-300
                text-[10px] sm:text-xs font-medium
              "
            >
              تنها {stock} عدد
            </div>
          )}

          {stock === 0 && (
            <div
              className="
                absolute top-2 sm:top-4 left-2 sm:left-4
                z-10
                px-2 sm:px-3 py-0.5 sm:py-1
                rounded-full
                bg-red-500/20
                border border-red-500/30
                text-red-300
                text-[10px] sm:text-xs font-medium
              "
            >
              ناموجود
            </div>
          )}

          {/* Product Image - ارتفاع ریسپانسیو */}
          <div
            className="
              relative
              h-[200px] sm:h-[260px] md:h-[280px] lg:h-[320px]
              flex items-center justify-center
              overflow-hidden
            "
          >
            <div
              className="
                absolute inset-0
                opacity-0
                bg-gradient-to-b from-violet-500/10 to-cyan-500/10
                transition-opacity duration-500
                group-hover:opacity-100
              "
            />

            {productImage ? (
              <img
                src={productImage}
                alt={title}
                className="
                  w-full h-full object-cover
                  transition-transform duration-500
                  group-hover:scale-110
                "
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="
                  w-[60px] sm:w-[80px] lg:w-[100px]
                  h-[140px] sm:h-[180px] lg:h-[220px]
                  rounded-2xl sm:rounded-3xl
                  bg-gradient-to-b from-zinc-600 to-zinc-900
                  transition-transform duration-500
                  group-hover:-translate-y-3
                  shadow-[0_20px_60px_rgba(0,0,0,0.5)]
                "
              />
            )}

            <div
              className="
                absolute bottom-4 sm:bottom-8
                w-16 sm:w-24
                h-2 sm:h-4
                bg-violet-500/20
                blur-xl
                rounded-full
                transition-all duration-500
                group-hover:w-20 sm:group-hover:w-32
                group-hover:bg-violet-500/30
              "
            />
          </div>

          {/* Content - padding ریسپانسیو */}
          <div className="p-3 sm:p-4 md:p-5 lg:p-6 border-t border-white/5">
            <p className="text-zinc-500 text-[10px] sm:text-xs md:text-sm">
              {seller}
            </p>

            <h3 className="mt-1 sm:mt-2 text-base sm:text-lg md:text-xl font-bold leading-tight line-clamp-2">
              {title}
            </h3>

            {/* Star Rating */}
            <div className="mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2">
              <StarRating rating={averageRating} />
              {reviewCount > 0 && (
                <span className="text-[10px] sm:text-xs text-zinc-500">
                  ({reviewCount})
                </span>
              )}
            </div>

            <div className="mt-2 sm:mt-3 md:mt-4 flex items-center justify-between">
              <span className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold">
                {price.toLocaleString("fa-IR")} تومان
              </span>

              <span
                className="
                  w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10
                  rounded-full
                  border border-white/10
                  flex items-center justify-center
                  text-xs sm:text-sm md:text-base
                  text-zinc-400
                  transition-all duration-300
                  group-hover:border-violet-500/50
                  group-hover:text-violet-300
                  group-hover:bg-violet-500/10
                "
              >
                ←
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Tilt>
  );
}