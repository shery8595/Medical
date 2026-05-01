import { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface ProseProps {
    children: ReactNode;
    className?: string;
}

/** Documentation prose — light theme only (matches dApp shell). */
export function Prose({ children, className }: ProseProps) {
    return (
        <div
            className={cn(
                "prose prose-slate max-w-none lg:prose-lg xl:prose-xl",
                "prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight",
                "prose-h1:text-4xl prose-h1:text-slate-900",
                "prose-h2:text-2xl prose-h2:mt-10 prose-h2:text-slate-800 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2",
                "prose-h3:text-xl prose-h3:text-slate-800",
                "prose-p:leading-relaxed prose-p:text-slate-600",
                "prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline",
                "prose-strong:font-bold prose-strong:text-slate-900",
                "prose-ul:list-disc prose-ol:list-decimal",
                "prose-li:text-slate-600",
                "prose-code:text-blue-700 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none",
                className
            )}
        >
            {children}
        </div>
    );
}
