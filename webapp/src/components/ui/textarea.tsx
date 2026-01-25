import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-lg border bg-secondary/30 px-4 py-3 text-base transition-all duration-200",
          "border-border/50 ring-offset-background resize-none",
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
Textarea.displayName = "Textarea";

export { Textarea };
