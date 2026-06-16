"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ProductShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!sectionRef.current) return;

    gsap.fromTo(
      titleRef.current,
      {
        opacity: 0,
        y: 100,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      }
    );

    gsap.fromTo(
      textRef.current,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.2,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      }
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      className="
        min-h-screen
        flex
        items-center
        justify-center
        relative
      "
    >
      <div className="text-center max-w-4xl px-6">

        <h2
          ref={titleRef}
          className="
            text-6xl
            md:text-8xl
            font-bold
            tracking-tight
          "
        >
          عملکرد پریمیوم
        </h2>

        <p
          ref={textRef}
          className="
            mt-8
            text-zinc-400
            text-xl
            leading-relaxed
          "
        >
          طراحی‌شده برای کاربرانی که بالاترین سطح عملکرد، قابلیت اطمینان و زیبایی را انتظار دارند.
        </p>

      </div>
    </section>
  );
}