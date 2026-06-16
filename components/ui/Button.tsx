import { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export default function Button({
  children,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  disabled = false,
  ...rest
}: ButtonProps) {
  const baseStyles = `
    px-8
    py-4
    rounded-full
    font-medium
    transition-all
    duration-300
  `;

  const variants = {
    primary: `
      bg-white
      text-black
      hover:scale-105
      hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]
    `,
    secondary: `
      border
      border-zinc-700
      hover:border-white
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  );
}