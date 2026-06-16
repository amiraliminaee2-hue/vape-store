"use client";

import { useEffect, useRef } from "react";

interface QueueItem {
  from: string;
  to: string;
  start: number;
  end: number;
  char?: string;
}

interface TextScrambleProps {
  text: string;
  className?: string;
  delay?: number;
}

const CHARS = "!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export default function TextScramble({
  text,
  className,
  delay = 0,
}: TextScrambleProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number>(0);
  const frameRequestRef = useRef<number | null>(null);
  const queueRef = useRef<QueueItem[]>([]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const scramble = () => {
      const newText = text;
      const length = newText.length;

      queueRef.current = [];

      for (let i = 0; i < length; i++) {
        const from = "";
        const to = newText[i] || "";
        const start = Math.floor(Math.random() * 20);
        const end = start + Math.floor(Math.random() * 20);
        queueRef.current.push({ from, to, start, end });
      }

      frameRef.current = 0;

      const update = () => {
        let output = "";
        let complete = 0;
        const queue = queueRef.current;

        for (let i = 0, n = queue.length; i < n; i++) {
          const item = queue[i];

          if (frameRef.current >= item.end) {
            complete++;
            output += item.to;
          } else if (frameRef.current >= item.start) {
            if (!item.char || Math.random() < 0.28) {
              item.char = CHARS[Math.floor(Math.random() * CHARS.length)];
            }
            output += `<span style="opacity:0.4;color:#8b5cf6">${item.char}</span>`;
          } else {
            output += item.from;
          }
        }

        el.innerHTML = output;

        if (complete === queue.length) return;

        frameRef.current++;
        frameRequestRef.current = requestAnimationFrame(update);
      };

      setTimeout(() => {
        frameRequestRef.current = requestAnimationFrame(update);
      }, delay * 1000);
    };

    scramble();

    return () => {
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
    };
  }, [text, delay]);

  return (
    <span
      ref={elementRef}
      className={className}
    />
  );
}