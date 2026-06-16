import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
}

export default function GlassCard({
  children,
}: GlassCardProps) {
  return (
    <div
      className="
        p-8

        rounded-3xl

        border
        border-white/10

        bg-white/5

        backdrop-blur-xl

        transition-all
        duration-300

        hover:border-white/20
      "
    >
      {children}
    </div>
  );
}