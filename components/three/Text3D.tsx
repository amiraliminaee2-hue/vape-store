"use client";

import { Canvas } from "@react-three/fiber";
import { Text3D, Center } from "@react-three/drei";

function ThreeDText() {
  return (
    <Center>
      <Text3D
        font="/fonts/Vazirmatn_Bold.json"
        size={0.8}
        height={0.2}
        curveSegments={32}
        bevelEnabled
        bevelThickness={0.02}
        bevelSize={0.01}
        bevelSegments={8}
      >
        پاد بوشهر
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#4c1d95"
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </Text3D>
    </Center>
  );
}

export default function Text3DScene() {
  return (
    <div className="w-full h-[300px]">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
        <ThreeDText />
      </Canvas>
    </div>
  );
}