"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";

// نقاط طلایی ثابت و از پیش تعیین شده
const GOLDEN_DOTS = [
  52, 48, 34, 67, 23, 89, 45, 12, 78, 56,
  91, 33, 77, 44, 88, 22, 66, 99, 41, 73,
  28, 84, 37, 92, 19, 63, 47, 81, 53, 29,
  71, 38, 85, 14, 68, 93, 27, 74, 49, 82,
  36, 94, 58, 21, 76, 43, 87, 32, 97, 62,
];

function createLogoTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // پس‌زمینه بنفش گرادیان
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#6d28d9");
  gradient.addColorStop(0.5, "#4c1d95");
  gradient.addColorStop(1, "#2e1065");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // حلقه‌های تزئینی
  ctx.strokeStyle = "#a855f7";
  ctx.lineWidth = 8;
  for (let i = 0; i < 5; i++) {
    const size = 200 + i * 80;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, size, 0, Math.PI * 2);
    ctx.stroke();
  }

  // خطوط شبکه
  ctx.strokeStyle = "#c084fc";
  ctx.lineWidth = 3;
  for (let i = 0; i <= 12; i++) {
    const pos = i * (canvas.height / 12);
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();
  }

  // نقاط طلایی (موقعیت‌های ثابت)
  ctx.fillStyle = "#fbbf24";
  for (let i = 0; i < GOLDEN_DOTS.length; i++) {
    const angle = GOLDEN_DOTS[i] * (Math.PI * 2 / 100);
    const radius = canvas.width / 2.5;
    const x = canvas.width / 2 + Math.cos(angle) * radius;
    const y = canvas.height / 2 + Math.sin(angle) * radius;
    ctx.fillRect(x, y, 5, 5);
  }

  // آرم مرکزی - متن "پاد بوشهر" به فارسی
  ctx.font = `bold ${canvas.width / 6}px "Vazirmatn", "Segoe UI", Tahoma, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = 20;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("پاد بوشهر", canvas.width / 2, canvas.height / 2 - 30);
  
  // متن زیر آرم - "Pad Bushehr"
  ctx.font = `${canvas.width / 14}px "Vazirmatn", "Segoe UI", Tahoma, sans-serif`;
  ctx.fillStyle = "#c084fc";
  ctx.shadowBlur = 10;
  ctx.fillText("Pad Bushehr", canvas.width / 2, canvas.height / 2 + 50);

  // حلقه تزئینی اطراف متن
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2 - 5, 160, 0, Math.PI * 2);
  ctx.strokeStyle = "#a855f7";
  ctx.lineWidth = 3;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function RotatingGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const texture = createLogoTexture();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.08) * 0.1;
    }
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* کره اصلی */}
      <mesh ref={meshRef}>
        <Sphere args={[1.2, 128, 128]}>
          <meshStandardMaterial
            map={texture}
            roughness={0.2}
            metalness={0.8}
            emissive="#4c1d95"
            emissiveIntensity={0.2}
          />
        </Sphere>
      </mesh>

      {/* لایه بیرونی نیمه‌شفاف */}
      <mesh scale={1.02}>
        <Sphere args={[1.2, 64, 64]}>
          <meshStandardMaterial
            color="#a855f7"
            roughness={0.3}
            metalness={0.5}
            transparent
            opacity={0.1}
          />
        </Sphere>
      </mesh>

      {/* حلقه‌های دور کره */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.35, 0.02, 64, 200]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.5} />
      </mesh>

      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[1.4, 0.015, 64, 200]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

export default function SimpleGlobe() {
  const [dimensions, setDimensions] = useState({ width: 280, height: 280 });

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setDimensions({ width: 220, height: 220 }); // موبایل کوچک
      } else if (width < 768) {
        setDimensions({ width: 280, height: 280 }); // موبایل بزرگ
      } else if (width < 1024) {
        setDimensions({ width: 380, height: 380 }); // تبلت
      } else if (width < 1280) {
        setDimensions({ width: 450, height: 450 }); // لپ‌تاپ
      } else {
        setDimensions({ width: 550, height: 550 }); // دسکتاپ بزرگ
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <div 
      className="mx-auto flex justify-center items-center"
      style={{ 
        width: dimensions.width, 
        height: dimensions.height 
      }}
    >
      <Canvas 
        camera={{ position: [0, 0, 4], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-3, -2, 4]} intensity={0.6} color="#8b5cf6" />
        <pointLight position={[3, -2, 3]} intensity={0.4} color="#06b6d4" />
        <RotatingGlobe />
      </Canvas>
    </div>
  );
}