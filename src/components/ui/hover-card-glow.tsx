import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface HoverCardGlowProps {
  children: ReactNode;
  className?: string;
}

export function HoverCardGlow({ children, className }: HoverCardGlowProps) {
  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary/50 to-purple-600/50 opacity-0 blur-xl transition-all duration-300 group-hover:opacity-100"></div>
      <div className={cn("relative rounded-lg bg-card", className)}>
        {children}
      </div>
    </div>
  );
}
