"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "black" | "transparent" | "transparent-red" | "transparent-secondary";
  children: ReactNode;
  className?: string;
}

export default function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses = "px-4 py-2.5 text-xs font-medium cursor-pointer rounded-[10px] transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "btn-primary",
    black: "btn-black",
    transparent: "btn-transparent",
    "transparent-red": "btn-transparent-red",
    "transparent-secondary": "btn-transparent-secondary",
  };

  // For primary buttons with gradient hover, wrap children to ensure proper z-index
  const shouldWrapChildren = variant === "primary";

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {shouldWrapChildren ? (
        <span className="relative z-[1] flex items-center justify-center gap-2">{children}</span>
      ) : (
        children
      )}
    </button>
  );
}

