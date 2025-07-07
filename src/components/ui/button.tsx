import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-glow active:translate-y-0.5 border border-primary/20",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-glow active:translate-y-0.5 border border-destructive/20",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/30 active:translate-y-0.5 hover:shadow-glow",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-glow active:translate-y-0.5 border border-secondary/20",
        ghost:
          "hover:bg-accent hover:text-accent-foreground active:translate-y-0.5 hover:shadow-sm",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        web3: "bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-blue-500/20 text-white border-2 border-transparent bg-clip-padding shadow-web3 hover:shadow-neon hover:scale-105 active:scale-95 backdrop-blur-sm relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-600 before:via-pink-500 before:to-blue-500 before:opacity-20 before:blur-xl transition-all duration-300",
        cyber:
          "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/50 shadow-cyber hover:shadow-web3 hover:border-cyan-400 active:translate-y-0.5 backdrop-blur-sm animate-cyber-glow",
        glow: "bg-gradient-to-r from-pink-500/30 to-purple-600/30 text-white border-2 border-pink-500/50 shadow-neon hover:shadow-web3 hover:border-pink-400/70 active:translate-y-0.5 backdrop-blur-sm animate-neon-pulse",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
