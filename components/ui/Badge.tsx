import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
}

export default function Badge({
  children,
}: BadgeProps) {
  return (
    <span
      className="
        inline-block
        px-4
        py-2
        rounded-full

        border
        border-zinc-800

        bg-zinc-900/50
      "
    >
      {children}
    </span>
  );
}