import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export function ShimmerButton({
  children,
  className,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex h-12 overflow-hidden rounded-md p-[1px]",
        className,
      )}
      {...props}
    >
      <span className="absolute inset-[-1000%] animate-[shimmer_2s_linear_infinite] bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-md bg-background px-6 py-2 text-sm font-medium backdrop-blur-3xl">
        {children}
      </span>
    </button>
  );
}
