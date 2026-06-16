"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

import * as THREE from "three";

export default function Smoke() {
  const pointsRef =
    useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const count = 150;

    const positions =
      new Float32Array(count * 3);

    let seed = 12345;

    const random = () => {
      seed =
        (seed * 16807) % 2147483647;

      return (
        (seed - 1) / 2147483646
      );
    };

    for (let i = 0; i < count; i++) {
      positions[i * 3] =
        (random() - 0.5) * 0.2;

      positions[i * 3 + 1] =
        random() * 2;

      positions[i * 3 + 2] =
        (random() - 0.5) * 0.2;
    }

    const geo =
      new THREE.BufferGeometry();

    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(
        positions,
        3
      )
    );

    return geo;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const positions =
      pointsRef.current.geometry
        .attributes.position;

    const t =
      state.clock.elapsedTime;

    for (
      let i = 0;
      i < positions.count;
      i++
    ) {
      const x = i * 3;
      const y = i * 3 + 1;

      positions.array[y] += 0.004;

      positions.array[x] +=
        Math.sin(t + i) * 0.0005;

      if (
        positions.array[y] > 3
      ) {
        positions.array[y] = 0;
      }
    }

    positions.needsUpdate = true;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      position={[0, 2.4, 0]}
    >
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