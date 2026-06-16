"use client";

import { useRef, ReactNode } from "react";
import gsap from "gsap";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
}

export default function MagneticButton({
  children,
  className,
  strength = 0.4,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const boundingRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = () => {
    boundingRef.current =
      buttonRef.current?.getBoundingClientRect() || null;
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!boundingRef.current || !buttonRef.current) return;

    const { clientX, clientY } = e;
    const { left, top, width, height } = boundingRef.current;

    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);

    gsap.to(buttonRef.current, {
      x: x * strength,
      y: y * strength,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (!buttonRef.current) return;

    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    });
  };

  return (
    <div
      ref={buttonRef}
      className={`inline-block ${className || ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}