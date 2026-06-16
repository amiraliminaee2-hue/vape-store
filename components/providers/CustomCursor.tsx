"use client";

import { useEffect, useState } from "react";

export default function CustomCursor() {
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    // Hide the native cursor only while this component is mounted (non-admin pages)
    document.body.style.cursor = "none";

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      // Restore native cursor when navigating to admin or unmounting
      document.body.style.cursor = "auto";
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <>
      <div
        className="
          fixed
          w-3
          h-3
          rounded-full
          bg-white
          pointer-events-none
          z-[9999]
        "
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
        }}
      />

      <div
        className="
          fixed
          w-10
          h-10
          rounded-full
          border
          border-white/30
          pointer-events-none
          z-[9998]
          transition-transform
          duration-150
        "
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
        }}
      />
    </>
  );
}