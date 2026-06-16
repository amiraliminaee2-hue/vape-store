"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

export default function ProductModel() {
  const groupRef = useRef<THREE.Group>(null);
  const ledRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const smokePointsRef = useRef<THREE.Points | null>(null);
  const smokeGeometryRef = useRef<THREE.BufferGeometry | null>(null);

  const [batteryPercent, setBatteryPercent] = useState<number>(85);
  const [smokeOpacity, setSmokeOpacity] = useState<number>(0);
  const [smokeGeometry, setSmokeGeometry] = useState<THREE.BufferGeometry | null>(null);

  const smokeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // تولید هندسه ذرات برای دود - دقیقاً در دهانه پاد
  useEffect(() => {
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // موقعیت اولیه دقیقاً در نوک دهانه پاد (Y = 2.45)
      positions[i * 3]     = (Math.random() - 0.5) * 0.15;     // X: محدوده بسیار کوچک
      positions[i * 3 + 1] = 2.35 + Math.random() * 0.15;      // Y: بین 2.35 تا 2.5 (دقیقاً روی دهانه)
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.15;     // Z: محدوده بسیار کوچک
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    smokeGeometryRef.current = geometry;
    setSmokeGeometry(geometry);
  }, []);

  // فعال کردن دود برای ۲ ثانیه
  const triggerSmoke = () => {
    if (smokeTimerRef.current) clearTimeout(smokeTimerRef.current);
    setSmokeOpacity(0.8);
    smokeTimerRef.current = setTimeout(() => {
      setSmokeOpacity(0);
    }, 2000);
  };

  // گوش دادن به رویداد دکمه از ProductScene
  useEffect(() => {
    window.addEventListener("trigger-smoke", triggerSmoke);
    return () => window.removeEventListener("trigger-smoke", triggerSmoke);
  }, []);

  // کاهش شارژ باتری به آرامی
  useEffect(() => {
    const interval = setInterval(() => {
      setBatteryPercent((prev) => Math.max(0, prev - 0.5));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // تکسچر نمایشگر
  const createDisplayTexture = (percent: number): THREE.CanvasTexture => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#00ffcc";
      ctx.font = "Bold 80px 'Monaco', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${Math.floor(percent)}%`, canvas.width / 2, canvas.height / 2 - 20);

      const barWidth = (canvas.width - 80) * (percent / 100);
      ctx.fillRect(40, canvas.height - 50, barWidth, 20);
      ctx.strokeStyle = "#00ffcc";
      ctx.lineWidth = 2;
      ctx.strokeRect(40, canvas.height - 50, canvas.width - 80, 20);

      if (percent < 20) {
        ctx.fillStyle = "#ff4444";
        ctx.fillText(`${Math.floor(percent)}%`, canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = "#ff4444";
        ctx.fillRect(40, canvas.height - 50, barWidth, 20);
        ctx.strokeStyle = "#ff4444";
        ctx.strokeRect(40, canvas.height - 50, canvas.width - 80, 20);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  const [displayTexture, setDisplayTexture] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    setDisplayTexture(createDisplayTexture(batteryPercent));
  }, [batteryPercent]);

  // انیمیشن هر فریم
  useFrame((state) => {
    if (!groupRef.current) return;

    const elapsedTime = state.clock.elapsedTime;

    groupRef.current.rotation.y = elapsedTime * 0.35;
    groupRef.current.position.y = Math.sin(elapsedTime * 1.3) * 0.18;
    groupRef.current.rotation.x = Math.sin(elapsedTime * 0.7) * 0.04;

    const pulse = 2 + Math.sin(elapsedTime * 4) * 1.5;
    if (ledRef.current?.material instanceof THREE.MeshStandardMaterial) {
      ledRef.current.material.emissiveIntensity = pulse;
    }

    if (glowRef.current?.material instanceof THREE.MeshBasicMaterial) {
      glowRef.current.scale.setScalar(1 + Math.sin(elapsedTime * 2) * 0.08);
    }

    // حرکت ذرات دود
    if (smokeGeometryRef.current && smokePointsRef.current) {
      const positions = smokeGeometryRef.current.attributes.position.array as Float32Array;
      const particleCount = 200;

      if (smokePointsRef.current.material instanceof THREE.PointsMaterial) {
        smokePointsRef.current.material.opacity = smokeOpacity * 0.4;
      }

      if (smokeOpacity > 0) {
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          // حرکت به سمت بالا
          positions[i3 + 1] += 0.04;
          // حرکت افقی ملایم
          positions[i3]     += (Math.sin(elapsedTime * 2 + i) * 0.006);
          positions[i3 + 2] += (Math.cos(elapsedTime * 2 + i) * 0.006);

          // ریست کردن ذرات - بازگشت به دهانه
          if (positions[i3 + 1] > 3.5) {
            positions[i3 + 1] = 2.4;
            positions[i3]     = (Math.random() - 0.5) * 0.15;
            positions[i3 + 2] = (Math.random() - 0.5) * 0.15;
          }

          // محدود کردن حرکت افقی
          positions[i3]     = Math.max(-0.35, Math.min(0.35, positions[i3]));
          positions[i3 + 2] = Math.max(-0.35, Math.min(0.35, positions[i3 + 2]));
        }

        smokeGeometryRef.current.attributes.position.needsUpdate = true;
      }
    }
  });

  // محاسبه سایز ریسپانسیو
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScale(0.7);
      } else if (width < 768) {
        setScale(0.8);
      } else if (width < 1024) {
        setScale(0.9);
      } else {
        setScale(1);
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <group ref={groupRef} scale={scale}>

      {/* بدنه اصلی */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.72, 4.3, 128]} />
        <meshPhysicalMaterial
          color="#38bdf8"
          metalness={0.85}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.05}
          emissive="#0369a1"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* نوار شیشه‌ای */}
      <mesh position={[0, 0.2, 0.72]} castShadow>
        <boxGeometry args={[0.2, 2.3, 0.05]} />
        <meshPhysicalMaterial
          color="#0ea5e9"
          metalness={0.8}
          roughness={0.2}
          transmission={0.7}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* نمایشگر LED */}
      {displayTexture && (
        <mesh position={[0, -0.6, 0.74]} castShadow>
          <boxGeometry args={[0.55, 0.4, 0.05]} />
          <meshStandardMaterial
            map={displayTexture}
            emissive="#00ffcc"
            emissiveIntensity={0.4}
          />
        </mesh>
      )}

      {/* گلو آبی */}
      <mesh ref={glowRef} position={[0, -0.6, 0.71]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.12} />
      </mesh>

      {/* دهانی (نوک پاد) */}
      <mesh position={[0, 2.45, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.34, 0.75, 64]} />
        <meshPhysicalMaterial
          color="#0f172a"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* حلقه بالایی */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <torusGeometry args={[0.43, 0.04, 32, 100]} />
        <meshStandardMaterial
          color="#c0c0c0"
          metalness={0.95}
          roughness={0.08}
        />
      </mesh>

      {/* حلقه پایینی */}
      <mesh position={[0, -1.3, 0]} castShadow>
        <torusGeometry args={[0.52, 0.03, 32, 100]} />
        <meshStandardMaterial
          color="#a0a0a0"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* LED کوچک */}
      <mesh ref={ledRef} position={[0, -1.2, 0.74]}>
        <sphereGeometry args={[0.07, 32, 32]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={3}
        />
      </mesh>

      {/* دریچه هوا */}
      <mesh position={[0, -1.8, 0.65]} castShadow>
        <cylinderGeometry args={[0.48, 0.48, 0.15, 32]} />
        <meshStandardMaterial
          color="#1e3a5f"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* ذرات دود - موقعیت پایین‌تر روی دهانه */}
      {smokeGeometry && (
        <points ref={smokePointsRef} position={[0, 0.5, 0]}>
          <primitive object={smokeGeometry} attach="geometry" />
          <pointsMaterial
            color="#d0d0d0"
            size={0.03}
            transparent
            opacity={smokeOpacity * 0.4}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* نقاط هولوگرام */}
      <mesh position={[1.1, 0.5, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      <mesh position={[-1.1, -0.8, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#0ea5e9" />
      </mesh>

      <mesh position={[0.8, 1.2, -0.3]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>

      <mesh position={[-0.5, -1.5, 0.4]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial color="#7dd3fc" />
      </mesh>

    </group>
  );
}