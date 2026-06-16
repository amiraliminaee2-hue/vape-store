"use client";

import { useState, useEffect } from "react";

interface PriceFilterProps {
  min: number;
  max: number;
  onPriceChange: (min: number, max: number) => void;
}

export default function PriceFilter({ min, max, onPriceChange }: PriceFilterProps) {
  const [minPrice, setMinPrice] = useState<number>(min);
  const [maxPrice, setMaxPrice] = useState<number>(max);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    setMinPrice(min);
    setMaxPrice(max);
  }, [min, max]);

  const handleMinChange = (value: number) => {
    const newMin = Math.min(value, maxPrice - 1000);
    setMinPrice(newMin);
    onPriceChange(newMin, maxPrice);
  };

  const handleMaxChange = (value: number) => {
    const newMax = Math.max(value, minPrice + 1000);
    setMaxPrice(newMax);
    onPriceChange(minPrice, newMax);
  };

  const formatPrice = (price: number): string => {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + " میلیون تومان";
    }
    return price.toLocaleString("fa-IR") + " تومان";
  };

  const formatPriceShort = (price: number): string => {
    if (price >= 1000000) {
      return (price / 1000000).toFixed(1) + "M";
    }
    if (price >= 1000) {
      return (price / 1000).toFixed(0) + "K";
    }
    return price.toString();
  };

  return (
    <>
      {/* دکمه موبایل - فقط در سایز موبایل نمایش داده می‌شود */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full lg:hidden
          flex items-center justify-between
          px-4 py-3
          rounded-xl
          border border-white/10
          bg-white/5
          text-white
          transition-all
        "
      >
        <span className="font-medium">فیلتر قیمت</span>
        <span className="text-sm text-zinc-400">
          {formatPriceShort(minPrice)} - {formatPriceShort(maxPrice)}
        </span>
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* پنل فیلتر - در موبایل به صورت dropdown، در دسکتاپ همیشه باز */}
      <div
        className={`
          ${isOpen ? "block" : "hidden"} 
          lg:block
          space-y-4 p-4 rounded-xl
          border border-white/10 bg-white/[0.03]
          transition-all duration-300
        `}
      >
        <h3 className="text-base sm:text-lg font-semibold hidden lg:block">
          فیلتر قیمت
        </h3>

        {/* مقادیر فعلی */}
        <div className="flex justify-between text-xs sm:text-sm text-zinc-400">
          <span>از {formatPrice(minPrice)}</span>
          <span>تا {formatPrice(maxPrice)}</span>
        </div>

        {/* نوار لغزنده حداقل */}
        <div className="space-y-1">
          <label className="text-xs text-zinc-500 block">حداقل قیمت</label>
          <input
            type="range"
            min={min}
            max={max}
            value={minPrice}
            onChange={(e) => handleMinChange(parseInt(e.target.value))}
            className="
              w-full h-1.5 sm:h-2
              bg-zinc-700
              rounded-lg
              appearance-none
              cursor-pointer
              accent-violet-500
            "
          />
        </div>

        {/* نوار لغزنده حداکثر */}
        <div className="space-y-1">
          <label className="text-xs text-zinc-500 block">حداکثر قیمت</label>
          <input
            type="range"
            min={min}
            max={max}
            value={maxPrice}
            onChange={(e) => handleMaxChange(parseInt(e.target.value))}
            className="
              w-full h-1.5 sm:h-2
              bg-zinc-700
              rounded-lg
              appearance-none
              cursor-pointer
              accent-violet-500
            "
          />
        </div>

        {/* محدوده کل */}
        <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs text-zinc-500 pt-2 border-t border-white/5">
          <span>حداقل: {formatPriceShort(min)}</span>
          <span className="text-zinc-600">|</span>
          <span>حداکثر: {formatPriceShort(max)}</span>
        </div>

        {/* دکمه اعمال در موبایل */}
        <button
          onClick={() => setIsOpen(false)}
          className="
            w-full lg:hidden
            mt-3
            px-4 py-2.5
            rounded-xl
            bg-violet-600
            hover:bg-violet-500
            transition-colors
            text-sm font-medium
          "
        >
          اعمال فیلتر
        </button>
      </div>
    </>
  );
}