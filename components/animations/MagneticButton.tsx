"use client";

import { useRef, ReactNode } from "react";

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
  const frameRef = useRef<number | null>(null);

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

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      if (!buttonRef.current) return;
      buttonRef.current.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
    });
  };

  const handleMouseLeave = () => {
    if (!buttonRef.current) return;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    buttonRef.current.style.transition = "transform 450ms cubic-bezier(0.16, 1, 0.3, 1)";
    buttonRef.current.style.transform = "translate3d(0, 0, 0)";
    window.setTimeout(() => {
      if (buttonRef.current) buttonRef.current.style.transition = "";
    }, 450);
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