"use client";

interface PriceWithDiscountProps {
  price: number;
  discountPercent: number;
  className?: string;
}

export default function PriceWithDiscount({ price, discountPercent, className = "" }: PriceWithDiscountProps) {
  if (!discountPercent || discountPercent <= 0) {
    return (
      <div className={className}>
        <span className="font-bold text-lg">{price.toLocaleString("fa-IR")} تومان</span>
      </div>
    );
  }

  const discountedPrice = price - (price * discountPercent / 100);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-zinc-500 line-through text-sm">
          {price.toLocaleString("fa-IR")} تومان
        </span>
        <span className="text-red-400 text-xs font-semibold bg-red-500/20 px-2 py-0.5 rounded-full">
          {discountPercent}%
        </span>
      </div>
      <div className="text-violet-400 font-bold text-lg">
        {discountedPrice.toLocaleString("fa-IR")} تومان
      </div>
    </div>
  );
}