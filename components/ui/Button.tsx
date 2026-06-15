"use client";

import { motion } from "framer-motion";
import { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "dark" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  // Base classes with touch-screen target minimum height: 48px
  const baseClasses = "inline-flex items-center justify-center font-sans font-semibold transition-colors focus:outline-none rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none active:scale-[0.97] w-full h-full";
  
  const variantClasses = {
    primary: "bg-primary text-cream border border-primary/20 hover:bg-primary/95 shadow-sm active:bg-primary/90",
    secondary: "bg-light text-dark hover:bg-light/95 border border-light/10 shadow-sm active:bg-light/90",
    outline: "bg-transparent text-primary border-2 border-primary hover:bg-primary/5 active:bg-primary/10",
    dark: "bg-dark text-cream border border-dark/20 hover:bg-dark/95 shadow-md active:bg-dark/90",
    ghost: "bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-small min-h-[40px]",
    md: "px-6 py-3.5 text-body min-h-[48px]",
    lg: "px-8 py-4.5 text-h3 min-h-[56px]",
  };

  const wrapperWidthClass = fullWidth ? "w-full" : "inline-block";

  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={wrapperWidthClass}
    >
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    </motion.div>
  );
}
