import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, iconPosition = "left", ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          {iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-lg border bg-secondary/30 px-4 py-2 text-base transition-all duration-200",
              "border-border/50 ring-offset-background",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
              "placeholder:text-muted-foreground/70",
              "hover:border-border hover:bg-secondary/50",
              "focus-visible:outline-none focus-visible:border-primary/50 focus-visible:bg-secondary/40",
              "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border/50 disabled:hover:bg-secondary/30",
              "md:text-sm",
              iconPosition === "left" && "pl-10",
              iconPosition === "right" && "pr-10",
              error && "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20",
              className
            )}
            ref={ref}
            {...props}
          />
          {iconPosition === "right" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border bg-secondary/30 px-4 py-2 text-base transition-all duration-200",
          "border-border/50 ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground/70",
          "hover:border-border hover:bg-secondary/50",
          "focus-visible:outline-none focus-visible:border-primary/50 focus-visible:bg-secondary/40",
          "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border/50 disabled:hover:bg-secondary/30",
          "md:text-sm",
          error && "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
