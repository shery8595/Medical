import { useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { getDocNavItem } from "../../lib/docsNav";

export interface DocsPageHeaderProps {
    /** Small uppercase label (e.g. section name) */
    eyebrow: string;
    title: string;
    description?: string;
    className?: string;
}

/** Title block for doc pages. Use with [`DocsPageToolbar`](./DocsPageToolbar.tsx) in the layout for copy actions. */
export function DocsPageHeader({ eyebrow, title, description, className }: DocsPageHeaderProps) {
    return (
        <div className={cn("not-prose flex flex-col gap-1.5 mb-4 pb-3 border-b border-slate-200/90", className)}>
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#00685f] mb-1">
                    {eyebrow}
                </p>
                <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-slate-900 m-0">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm text-slate-500 mt-1.5 max-w-2xl m-0 leading-snug">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}

/** Use under DocsPageHeader for “see also” links */
export function DocsPageSeeAlso({ children }: { children: React.ReactNode }) {
    return (
        <div className="not-prose -mt-4 mb-8 text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1 items-center">
            {children}
        </div>
    );
}

/** Maps current route to sidebar metadata; use on standard doc pages (not Introduction). */
export function DocsPageHeaderForRoute() {
    const { pathname } = useLocation();
    const item = getDocNavItem(pathname);
    if (!item) return null;
    return (
        <DocsPageHeader
            eyebrow={item.section}
            title={item.pageTitle ?? item.title}
            description={item.pageDescription}
        />
    );
}
