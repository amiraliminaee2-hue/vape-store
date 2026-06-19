"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export default function Smoke() {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const count = 150;
    const positions = new Float32Array(count * 3);

    let seed = 12345;

    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * 0.2;
      positions[i * 3 + 1] = random() * 2;
      positions[i * 3 + 2] = (random() - 0.5) * 0.2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    return geo;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const positionAttr = pointsRef.current.geometry.attributes["position"];
    if (!positionAttr) return;

    const positions = positionAttr.array as Float32Array;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < positionAttr.count; i++) {
      const x = i * 3;
      const y = i * 3 + 1;

      if (y < positions.length && x < positions.length) {
        positions[y] = (positions[y] ?? 0) + 0.004;
        positions[x] = (positions[x] ?? 0) + Math.sin(t + i) * 0.0005;

        if ((positions[y] ?? 0) > 3) {
          positions[y] = 0;
        }
      }
    }

    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry} position={[0, 2.4, 0]}>
      <pointsMaterial
        color="#ffffff"
        size={0.08}
        transparent
        opacity={0.12}
        depthWrite={false}
      />
    </points>
  );
}