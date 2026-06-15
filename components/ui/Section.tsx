import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  size?: "sm" | "md" | "lg" | "full";
  spacing?: "none" | "sm" | "md" | "lg";
}

export default function Section({
  children,
  className = "",
  id,
  size = "md",
  spacing = "md",
}: SectionProps) {
  const sizeClasses = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-7xl",
    full: "max-w-none",
  };

  const spacingClasses = {
    none: "py-0",
    sm: "py-8 md:py-12",  // 32px to 48px
    md: "py-16 md:py-24", // 64px to 96px
    lg: "py-24 md:py-32", // 96px to 128px
  };

  return (
    <section
      id={id}
      className={`w-full px-6 md:px-8 mx-auto flex flex-col justify-center ${spacingClasses[spacing]} ${className}`}
    >
      <div className={`w-full mx-auto ${sizeClasses[size]}`}>
        {children}
      </div>
    </section>
  );
}
