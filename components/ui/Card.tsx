import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  variant?: "cream" | "glass" | "dark" | "outline";
  rounded?: "xl" | "2xl";
  shadow?: "sm" | "md";
  className?: string;
  onClick?: () => void;
}

export default function Card({
  children,
  variant = "cream",
  rounded = "2xl",
  shadow = "md",
  className = "",
  onClick,
  ...props
}: CardProps) {
  const baseClasses = "transition-all duration-200 overflow-hidden";
  
  const variantClasses = {
    cream: "bg-cream border border-light/20 text-neutral-900",
    glass: "glass-premium text-neutral-900",
    dark: "bg-dark border border-primary/20 text-cream",
    outline: "bg-transparent border-2 border-light/40 text-neutral-900",
  };

  const roundedClasses = {
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  };

  const shadowClasses = {
    sm: "shadow-sm",
    md: "shadow-md",
  };

  const clickableClasses = onClick ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg active:scale-[0.99]" : "";

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${roundedClasses[rounded]} ${shadowClasses[shadow]} ${clickableClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
