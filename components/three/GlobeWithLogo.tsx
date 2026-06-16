"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, Text3D, Center } from "@react-three/drei";
import * as THREE from "three";

// ذرات ثابت و از پیش تعیین شده (بدون Math.random)
const PARTICLE_POSITIONS = [
  { x: 0.82, y: 0.52, z: 1.18 },
  { x: 1.05, y: 0.31, z: 1.02 },
  { x: 0.95, y: 0.88, z: 0.95 },
  { x: 0.62, y: 1.21, z: 0.78 },
  { x: 1.21, y: 0.62, z: 0.62 },
  { x: 0.48, y: 0.48, z: 1.41 },
  { x: 1.35, y: 0.25, z: 0.55 },
  { x: 0.35, y: 1.35, z: 0.55 },
  { x: 0.75, y: 0.95, z: 1.15 },
  { x: 1.15, y: 0.75, z: 0.95 },
  { x: 0.52, y: 1.05, z: 1.02 },
  { x: 1.02, y: 0.52, z: 1.05 },
  { x: 0.88, y: 0.62, z: 1.21 },
  { x: 0.31, y: 1.18, z: 0.82 },
  { x: 1.18, y: 0.31, z: 0.82 },
  { x: 0.55, y: 0.82, z: 1.35 },
  { x: 1.41, y: 0.48, z: 0.48 },
  { x: 0.25, y: 1.35, z: 0.55 },
  { x: 0.95, y: 1.15, z: 0.75 },
  { x: 1.35, y: 0.55, z: 0.25 },
  { x: 0.78, y: 1.21, z: 0.62 },
  { x: 1.21, y: 0.78, z: 0.48 },
  { x: 0.45, y: 1.28, z: 0.65 },
  { x: 1.28, y: 0.45, z: 0.65 },
  { x: 0.65, y: 0.65, z: 1.28 },
  { x: 0.58, y: 1.12, z: 1.12 },
  { x: 1.12, y: 0.58, z: 1.12 },
  { x: 0.72, y: 0.42, z: 1.48 },
  { x: 1.48, y: 0.72, z: 0.42 },
  { x: 0.42, y: 1.48, z: 0.72 },
];

function AnimatedGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.1;
    }
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = state.clock.getElapsedTime() * 0.2;
      ring1Ref.current.rotation.x = state.clock.getElapsedTime() * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = state.clock.getElapsedTime() * 0.15;
      ring2Ref.current.rotation.x = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#a855f7" />

      {/* کره اصلی */}
      <mesh ref={meshRef}>
        <Sphere args={[1.3, 64, 64]}>
          <meshStandardMaterial
            color="#8b5cf6"
            roughness={0.2}
            metalness={0.9}
            emissive="#4c1d95"
            emissiveIntensity={0.4}
          />
        </Sphere>
      </mesh>

      {/* لایه دوم کره (نیمه شفاف) */}
      <mesh scale={1.05}>
        <Sphere args={[1.3, 32, 32]}>
          <meshStandardMaterial
            color="#a855f7"
            roughness={0.3}
            metalness={0.5}
            transparent
            opacity={0.15}
            emissive="#a855f7"
            emissiveIntensity={0.2}
          />
        </Sphere>
      </mesh>

      {/* حلقه اول (افقی) */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.45, 0.025, 64, 200]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.6} />
      </mesh>

      {/* حلقه دوم (مورب) */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[1.5, 0.02, 64, 200]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.4} />
      </mesh>

      {/* ذرات اطراف کره */}
      {PARTICLE_POSITIONS.map((pos, i) => (
        <mesh key={i} position={[pos.x * 1.2, pos.y * 1.2, pos.z * 1.2]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#c084fc" : "#06b6d4"}
            emissive={i % 2 === 0 ? "#a855f7" : "#06b6d4"}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function GlobeWithLogo() {
  return (
    <div className="w-[400px] h-[400px] lg:w-[550px] lg:h-[550px] mx-auto">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-3, -2, 4]} intensity={0.6} color="#8b5cf6" />
        <pointLight position={[3, -2, 3]} intensity={0.5} color="#06b6d4" />
        
        <AnimatedGlobe />
      </Canvas>
    </div>
  );
}