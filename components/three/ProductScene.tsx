"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import ProductModel from "./ProductModel";
import Lights from "./Lights";

function GroundShadow() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]}>
      <circleGeometry args={[2.2, 64]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.35} />
    </mesh>
  );
}

export default function ProductScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSmoking, setIsSmoking] = useState(false);
  const smokeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    gsap.fromTo(
      containerRef.current,
      {
        opacity: 0,
        scale: 0.7,
        y: 80,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1.4,
        ease: "power4.out",
      }
    );
  }, []);

  const handleSmokeButton = () => {
    if (isSmoking) return;

    window.dispatchEvent(new Event("trigger-smoke"));
    setIsSmoking(true);

    if (smokeTimerRef.current) clearTimeout(smokeTimerRef.current);
    smokeTimerRef.current = setTimeout(() => {
      setIsSmoking(false);
    }, 2000);
  };

  return (
    <div
      ref={containerRef}
      className="
        relative
        w-full
        h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px]
        overflow-hidden
      "
    >
      {/* Main Glow - آبی روشن - ریسپانسیو */}
      <div
        className="
          absolute
          inset-0
          flex
          items-center
          justify-center
          pointer-events-none
        "
      >
        <div
          className="
            w-[450px] sm:w-[600px] md:w-[750px] lg:w-[850px]
            h-[450px] sm:h-[600px] md:h-[750px] lg:h-[850px]
            rounded-full
            bg-gradient-to-r
            from-blue-400/25
            via-cyan-400/20
            to-blue-500/25
            blur-[100px] sm:blur-[140px] md:blur-[160px] lg:blur-[180px]
          "
        />
      </div>

      {/* Secondary Glow - آبی - ریسپانسیو */}
      <div
        className="
          absolute
          top-1/2
          left-1/2
          -translate-x-1/2
          -translate-y-1/2
          w-[280px] sm:w-[380px] md:w-[450px] lg:w-[500px]
          h-[280px] sm:h-[380px] md:h-[450px] lg:h-[500px]
          rounded-full
          bg-blue-400/10
          blur-[80px] sm:blur-[100px] md:blur-[110px] lg:blur-[120px]
          pointer-events-none
        "
      />

      {/* Energy Ring - آبی روشن - ریسپانسیو */}
      <div
        className="
          absolute
          top-1/2
          left-1/2
          -translate-x-1/2
          -translate-y-1/2
          w-[300px] sm:w-[420px] md:w-[480px] lg:w-[520px]
          h-[300px] sm:h-[420px] md:h-[480px] lg:h-[520px]
          rounded-full
          border border-blue-400/10
          animate-spin
          pointer-events-none
        "
        style={{ animationDuration: "25s" }}
      />

      {/* Inner Ring - سیان - ریسپانسیو */}
      <div
        className="
          absolute
          top-1/2
          left-1/2
          -translate-x-1/2
          -translate-y-1/2
          w-[240px] sm:w-[340px] md:w-[390px] lg:w-[420px]
          h-[240px] sm:h-[340px] md:h-[390px] lg:h-[420px]
          rounded-full
          border border-cyan-400/10
          animate-spin
          pointer-events-none
        "
        style={{
          animationDuration: "18s",
          animationDirection: "reverse",
        }}
      />

      {/* Canvas - ریسپانسیو */}
      <Canvas
        camera={{
          position: [0, 0, 8],
          fov: 45,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Lights />
        <ProductModel />
        <GroundShadow />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
        />
        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>
      </Canvas>

      {/* دکمه دود - کنار راست صفحه - ریسپانسیو */}
      <div
        className="
          absolute
          right-2 sm:right-3 md:right-4 lg:right-6
          top-1/2
          -translate-y-1/2
          flex
          flex-col
          items-center
          gap-2 sm:gap-3
          z-10
        "
      >
        <button
          onClick={handleSmokeButton}
          disabled={isSmoking}
          className={`
            relative
            w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14
            rounded-full
            border-2
            flex
            items-center
            justify-center
            transition-all
            duration-300
            group
            ${
              isSmoking
                ? "border-cyan-400 bg-cyan-400/20 scale-110 cursor-not-allowed"
                : "border-white/20 bg-white/5 hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:scale-105 cursor-pointer"
            }
          `}
        >
          {/* آیکون دود / بخار - ریسپانسیو */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`
              w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-7 lg:h-7
              transition-all
              duration-300
              ${isSmoking ? "text-cyan-300" : "text-white/50 group-hover:text-cyan-300"}
            `}
          >
            <path
              d="M3 12C3 12 4 10 6 10C8 10 8 12 10 12C12 12 12 10 14 10C16 10 16 12 18 12C20 12 21 10 21 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M3 17C3 17 4 15 6 15C8 15 8 17 10 17C12 17 12 15 14 15C16 15 16 17 18 17C20 17 21 15 21 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M7 7C7 7 7.5 5 9 5C10.5 5 10.5 7 12 7C13.5 7 13.5 5 15 5C16.5 5 17 7 17 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          {/* پالس انیمیشن هنگام فعال بودن */}
          {isSmoking && (
            <span
              className="
                absolute
                inset-0
                rounded-full
                border-2
                border-cyan-400
                animate-ping
              "
            />
          )}
        </button>

        {/* لیبل - ریسپانسیو */}
        <span
          className={`
            text-[8px] sm:text-[9px] md:text-[10px]
            font-medium
            tracking-wider
            uppercase
            transition-colors
            duration-300
            ${isSmoking ? "text-cyan-400" : "text-white/30"}
          `}
        >
          {isSmoking ? "..." : "Vape"}
        </span>
      </div>
    </div>
  );
}