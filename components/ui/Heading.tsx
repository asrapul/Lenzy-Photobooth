import { ReactNode, ElementType } from "react";

interface HeadingProps {
  children: ReactNode;
  level?: "display" | "h1" | "h2" | "h3";
  as?: ElementType;
  className?: string;
  variant?: "dark" | "light" | "primary" | "muted";
}

export default function Heading({
  children,
  level = "h2",
  as,
  className = "",
  variant = "dark",
}: HeadingProps) {
  // Map level to tag if not explicitly set
  const Component = as || (level === "display" ? "h1" : level);

  const levelClasses = {
    display: "text-display font-black tracking-tight leading-[1.1]",
    h1: "text-h1 font-extrabold tracking-tight leading-[1.15]",
    h2: "text-h2 font-bold tracking-tight leading-[1.2]",
    h3: "text-h3 font-semibold tracking-tight leading-[1.25]",
  };

  const variantClasses = {
    dark: "text-neutral-900",
    light: "text-cream",
    primary: "text-primary",
    muted: "text-neutral-500",
  };

  return (
    <Component className={`font-sans ${levelClasses[level]} ${variantClasses[variant]} ${className}`}>
      {children}
    </Component>
  );
}
