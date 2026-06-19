"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Link from "next/link";

import ProductScene from "../three/ProductScene";
import MagneticButton from "../animations/MagneticButton";
import FloatingParticles from "../animations/FloatingParticles";

export default function Hero() {
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.2 });

    tl.fromTo(
      badgeRef.current,
      { opacity: 0, y: 30, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
    );

    tl.fromTo(
      lineRef.current,
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    );

    tl.fromTo(
      titleRef.current,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
      "-=0.3"
    );

    tl.fromTo(
      subtitleRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      "-=0.5"
    );

    tl.fromTo(
      buttonsRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
      "-=0.4"
    );

    tl.fromTo(
      statsRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
      "-=0.3"
    );
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="min-h-screen flex items-center pt-16 sm:pt-20 lg:pt-24 relative overflow-hidden">

      <FloatingParticles />

      <div
        className="
          absolute inset-0
          bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.15),transparent)]
          pointer-events-none
        "
      />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 xl:gap-16 items-center">

          <div className="order-2 lg:order-1 text-center lg:text-right">
            
            <div
              ref={badgeRef}
              className="
                inline-flex
                items-center
                gap-1.5 sm:gap-2
                px-3 sm:px-4 py-1.5 sm:py-2
                rounded-full
                border border-violet-500/30
                bg-violet-500/10
                backdrop-blur-md
                mx-auto lg:mx-0
              "
            >
              <span
                className="
                  w-1.5 h-1.5 sm:w-2 sm:h-2
                  rounded-full
                  bg-violet-400
                  animate-pulse
                "
              />
              <span className="text-violet-300 text-xs sm:text-sm font-medium whitespace-nowrap">
                پاد بوشهر | فروشگاه تخصصی ویپ و پاد
              </span>
            </div>

            <div
              ref={lineRef}
              className="
                mt-4 sm:mt-6
                w-12 sm:w-16 h-[2px]
                bg-gradient-to-r from-violet-500 to-transparent
                origin-left
                mx-auto lg:mx-0
              "
            />

            <h1
              ref={titleRef}
              className="
                mt-4 sm:mt-6
                text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl
                font-bold
                tracking-tight
                leading-[1.1] sm:leading-[1.05]
              "
            >
              کمترین{" "}
              <span
                className="
                  bg-gradient-to-r
                  from-violet-400
                  via-cyan-400
                  to-violet-400
                  bg-clip-text
                  text-transparent
                  bg-[length:200%_auto]
                  animate-[gradientMove_4s_linear_infinite]
                "
              >
                قیمت
              </span>
            </h1>

            <p
              ref={subtitleRef}
              className="
                mt-4 sm:mt-6 md:mt-8
                text-zinc-400
                text-base sm:text-lg md:text-xl
                max-w-xl
                leading-relaxed
                mx-auto lg:mx-0
              "
            >
              بهترین دستگاه‌های ویپ و پاد با کیفیت بالا و قیمت مناسب
            </p>
            <p
              ref={subtitleRef}
              className="
                mt-3 sm:mt-4 md:mt-6
                text-zinc-400
                text-base sm:text-lg md:text-xl
                max-w-xl
                leading-relaxed
                mx-auto lg:mx-0
              "
            >
              تجربه‌ای متفاوت از خرید آنلاین در فروشگاه پاد بوشهر
            </p>

            {/* دکمه‌ها */}
            <div
              ref={buttonsRef}
              className="mt-6 sm:mt-8 md:mt-10 flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <MagneticButton>
                <Link
                  href="/shop"
                  className="
                    group
                    relative
                    inline-flex items-center gap-2
                    px-5 sm:px-7 md:px-8 py-2.5 sm:py-3 md:py-4
                    rounded-full
                    bg-white text-black
                    font-semibold
                    text-sm sm:text-base
                    overflow-hidden
                    transition-all duration-300
                    hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]
                  "
                >
                  <span className="relative z-10">مشاهده محصولات</span>
                  <span
                    className="
                      relative z-10
                      transition-transform duration-300
                      group-hover:translate-x-1
                    "
                  >
                    ←
                  </span>
                  <div
                    className="
                      absolute inset-0
                      bg-gradient-to-r from-violet-400 to-cyan-400
                      opacity-0
                      transition-opacity duration-300
                      group-hover:opacity-20
                    "
                  />
                </Link>
              </MagneticButton>

              <MagneticButton>
                <Link
                  href="/about"
                  className="
                    inline-flex items-center gap-2
                    px-5 sm:px-7 md:px-8 py-2.5 sm:py-3 md:py-4
                    rounded-full
                    border border-zinc-700
                    text-zinc-300
                    font-medium
                    text-sm sm:text-base
                    transition-all duration-300
                    hover:border-violet-500/50
                    hover:text-white
                    hover:bg-violet-500/10
                  "
                >
                  بیشتر بدانید
                </Link>
              </MagneticButton>
            </div>

            <div
              ref={statsRef}
              className="
                mt-10 sm:mt-12 md:mt-16
                flex gap-6 sm:gap-8 md:gap-10
                border-t border-white/5
                pt-6 sm:pt-8 md:pt-10
                justify-center lg:justify-start
              "
            >
              {[
                { value: "", label: "" }
              ].map((stat, index) => (
                <div key={index}>
                  <div
                    className="
                      text-2xl sm:text-3xl font-bold
                      bg-gradient-to-r from-white to-zinc-400
                      bg-clip-text text-transparent
                    "
                  >
                    {stat.value}
                  </div>
                  <div className="mt-1 text-zinc-500 text-xs sm:text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

          </div>

          <div
            className="order-1 lg:order-2 relative transition-transform duration-300 ease-out flex justify-center"
            style={{
              transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
            }}
          >
            <ProductScene />
          </div>

        </div>
      </div>
    </section>
  );
}