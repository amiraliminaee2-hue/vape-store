"use client";

import { useEffect, useRef } from "react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function PinnedProduct() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!sectionRef.current) return;

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "+=2500",
      pin: true,
      scrub: true,
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      className="
        h-screen
        relative
        overflow-hidden
      "
    >
      <div
        className="
          absolute
          inset-0
          flex
          items-center
          justify-center
        "
      >
        <div
          className="
            w-[320px]
            h-[640px]
            rounded-[60px]
            border
            border-white/10
            bg-white/5
            backdrop-blur-xl
          "
        />
      </div>

      <div
        className="
          absolute
          top-1/2
          left-24
          -translate-y-1/2
          max-w-md
        "
      >
        <h2 className="text-6xl font-bold">
          دقت
        </h2>

        <p className="mt-6 text-zinc-400">
          طراحی‌شده برای عملکردی پایدار و یکنواخت.
        </p>
      </div>
    </section>
  );
}