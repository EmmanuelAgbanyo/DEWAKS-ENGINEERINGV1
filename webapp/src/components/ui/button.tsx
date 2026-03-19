import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-glow-md hover:bg-primary/95 hover:shadow-[0_0_25px_-5px_hsl(var(--primary)/0.6)] hover:-translate-y-[2px] active:translate-y-[0px] transition-all duration-300",
        destructive:
          "bg-destructive text-destructive-foreground shadow-elevation-1 hover:bg-destructive/90 hover:shadow-[0_0_20px_-5px_hsl(var(--destructive)/0.5)] hover:-translate-y-[2px] active:translate-y-[0px] transition-all duration-300",
        outline:
          "border border-border/80 bg-transparent text-foreground hover:bg-primary/5 hover:border-primary/40 hover:shadow-elevation-1 hover:-translate-y-[1px] active:translate-y-[0px] transition-all duration-300",
        secondary:
          "bg-secondary/15 backdrop-blur-md text-secondary-foreground border border-secondary/20 hover:bg-secondary/25 hover:border-secondary/40 hover:shadow-elevation-1 hover:-translate-y-[1px] transition-all duration-300",
        ghost:
          "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:-translate-y-[1px] transition-all duration-200",
        link:
          "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        glow:
          "bg-primary text-primary-foreground shadow-glow-md hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.7)] hover:brightness-110 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/30 before:to-white/0 before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700 hover:-translate-y-[2px] active:translate-y-[1px]",
        gradient:
          "bg-gradient-to-br from-primary via-[hsl(340,75%,60%)] to-[hsl(262,80%,60%)] text-white shadow-elevation-2 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.6)] hover:brightness-110 bg-[length:200%_200%] hover:bg-right hover:-translate-y-[2px] active:translate-y-[1px] transition-all duration-500",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
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
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
