"use client";

import { useEffect, useState } from "react";

export default function BackgroundGrid() {
  const [gridSize, setGridSize] = useState(60);

  useEffect(() => {
    const updateGridSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setGridSize(40); // موبایل: فاصله کمتر
      } else if (width < 1024) {
        setGridSize(50); // تبلت: فاصله متوسط
      } else {
        setGridSize(60); // دسکتاپ: فاصله استاندارد
      }
    };

    updateGridSize();
    window.addEventListener("resize", updateGridSize);
    return () => window.removeEventListener("resize", updateGridSize);
  }, []);

  return (
    <div
      className="
        fixed
        inset-0
        pointer-events-none
        z-[-1]
        opacity-[0.03] sm:opacity-[0.04] md:opacity-[0.05]
      "
    >
      <div
        className="
          absolute
          inset-0
        "
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(255,255,255,0.08) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,0.08) 1px,
              transparent 1px
            )
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
      />
    </div>
  );
}