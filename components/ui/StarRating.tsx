"use client";

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({ rating, interactive = false, onRate }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={interactive && onRate ? () => onRate(i + 1) : undefined}
          className={`text-2xl transition-colors ${
            i < rating ? "text-yellow-400" : "text-zinc-600"
          } ${interactive ? "hover:text-yellow-300 cursor-pointer" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}