"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SimpleGlobe from "../three/SimpleGlobe";

export default function GlobeHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // تنظیم موقعیت اولیه - بدون انیمیشن ورود
    if (globeRef.current) {
      gsap.set(globeRef.current, { opacity: 1, scale: 1, y: 0 });
    }
    if (textRef.current) {
      gsap.set(textRef.current, { opacity: 1, y: 0 });
    }
    if (buttonRef.current) {
      gsap.set(buttonRef.current, { opacity: 1, y: 0 });
    }
    if (arrowRef.current) {
      gsap.set(arrowRef.current, { opacity: 1, y: 0 });
    }

    // فقط اسکرول انیمیشن
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom top",
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const opacity = 1 - progress;
        const scale = 1 - progress * 0.3;
        const translateY = progress * 100;
        
        if (globeRef.current) {
          globeRef.current.style.opacity = String(Math.max(0, opacity));
          globeRef.current.style.transform = `scale(${scale}) translateY(${translateY}px)`;
        }
        if (textRef.current) {
          textRef.current.style.opacity = String(Math.max(0, opacity));
        }
        if (buttonRef.current) {
          buttonRef.current.style.opacity = String(Math.max(0, opacity));
        }
        if (arrowRef.current) {
          arrowRef.current.style.opacity = String(Math.max(0, opacity));
        }
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const scrollToProducts = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16 sm:pt-20"
      style={{ minHeight: "100vh", height: "100vh" }}
    >
      {/* پس‌زمینه گرادیان */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(139,92,246,0.15),transparent)] pointer-events-none"
      />

      {/* کره سه‌بعدی - ریسپانسیو */}
      <div ref={globeRef} className="relative z-0 w-full flex justify-center px-4">
        <div className="scale-75 sm:scale-90 md:scale-100">
          <SimpleGlobe />
        </div>
      </div>

      {/* متن - ریسپانسیو */}
      <div ref={textRef} className="mt-4 sm:mt-6 md:mt-8 text-center z-10 space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5 relative px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold">
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            پاد بوشهر
          </span>
        </h1>
        <p className="text-zinc-300 text-base sm:text-lg md:text-xl max-w-md sm:max-w-lg mx-auto leading-relaxed px-2">
          فروشگاه تخصصی ویپ، پاد و لیکوئید
        </p>
        <p className="text-zinc-400 text-xs sm:text-sm md:text-base max-w-xs sm:max-w-sm md:max-w-md mx-auto px-2">
          بهترین برندها | ضمانت اصالت کالا | ارسال سریع به سراسر کشور
        </p>
      </div>

      {/* دکمه بیشتر بدانید - ریسپانسیو */}
      <button
        ref={buttonRef}
        onClick={scrollToProducts}
        className="mt-6 sm:mt-8 md:mt-10 px-5 sm:px-6 md:px-7 lg:px-8 py-2 sm:py-2.5 md:py-3 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium text-sm sm:text-base transition-all duration-300 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 z-10 cursor-pointer relative"
      >
        بیشتر بدانید
      </button>

      {/* فلش پایین - ریسپانسیو */}
      <div
        ref={arrowRef}
        className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 text-zinc-500 text-xl sm:text-2xl md:text-3xl animate-bounce cursor-pointer z-10 transition-all hover:text-zinc-300"
        onClick={scrollToProducts}
      >
        ↓
      </div>
    </section>
  );
}