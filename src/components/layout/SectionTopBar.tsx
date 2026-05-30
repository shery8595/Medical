import { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { dashboardBleedBar } from "../../lib/dashboardLayout";

interface SectionTopBarProps {
  title: string;
  rightContent?: ReactNode;
  className?: string;
}

export function SectionTopBar({ title, rightContent, className = "" }: SectionTopBarProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-30 mb-2 border-b border-slate-200/90 bg-white/95 py-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md",
        dashboardBleedBar,
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{title}</h2>
        {rightContent ?? <span />}
      </div>
    </div>
  );
}
