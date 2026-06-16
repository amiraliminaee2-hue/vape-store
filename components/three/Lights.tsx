"use client";

export default function Lights() {
  return (
    <>
      <ambientLight intensity={1.2} />

      <directionalLight
        position={[5, 5, 5]}
        intensity={3}
      />

      {/* نور اصلی آبی روشن از چپ */}
      <pointLight
        position={[-5, 3, 5]}
        intensity={6}
        color="#38bdf8"
      />

      {/* نور آبی از راست */}
      <pointLight
        position={[5, -3, 5]}
        intensity={5}
        color="#0ea5e9"
      />

      {/* نور سیان از بالا */}
      <pointLight
        position={[0, 6, 3]}
        intensity={3}
        color="#22d3ee"
      />

      <spotLight
        position={[0, 8, 5]}
        intensity={2}
        angle={0.3}
        penumbra={1}
      />
    </>
  );
}