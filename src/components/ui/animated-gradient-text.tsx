import { cn } from "@/lib/utils";

interface AnimatedGradientTextProps {
  text: string;
  className?: string;
}

export function AnimatedGradientText({
  text,
  className,
}: AnimatedGradientTextProps) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x",
        className,
      )}
    >
      {text}
    </span>
  );
}
