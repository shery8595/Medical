import { ReactNode } from "react";

interface SectionTopBarProps {
  title: string;
  rightContent?: ReactNode;
  className?: string;
}

export function SectionTopBar({ title, rightContent, className = "" }: SectionTopBarProps) {
  return (
    <div className={`sticky top-0 z-20 -mx-6 md:-mx-8 lg:-mx-10 px-6 md:px-8 lg:px-10 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {rightContent ?? <span />}
      </div>
    </div>
  );
}
