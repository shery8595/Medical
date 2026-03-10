import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps {
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  children?: React.ReactNode;
  [key: string]: any;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80":
            variant === "default",
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200":
            variant === "secondary",
          "border-transparent bg-danger text-white hover:bg-danger/80":
            variant === "destructive",
          "text-slate-950 dark:text-slate-50": variant === "outline",
          "border-transparent bg-success text-white hover:bg-success/80":
            variant === "success",
          "border-transparent bg-warning text-white hover:bg-warning/80":
            variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
