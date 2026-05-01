import { useState, useCallback } from "react";
import { Check, Link2, FileText } from "lucide-react";
import { cn } from "../../lib/utils";

/** Renders above article content: copy full page text + copy URL. `DocsLayout` wraps children in `#docs-article-body`. */
export function DocsPageToolbar() {
    const [linkCopied, setLinkCopied] = useState(false);
    const [pageCopied, setPageCopied] = useState(false);

    const copyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(typeof window !== "undefined" ? window.location.href : "");
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch {
            setLinkCopied(false);
        }
    }, []);

    const copyPage = useCallback(async () => {
        const el = document.getElementById("docs-article-body");
        if (!el) return;
        const text = el.innerText.replace(/\n{3,}/g, "\n\n").trim();
        try {
            await navigator.clipboard.writeText(text);
            setPageCopied(true);
            setTimeout(() => setPageCopied(false), 2000);
        } catch {
            setPageCopied(false);
        }
    }, []);

    return (
        <div
            className="not-prose flex flex-wrap items-center justify-end gap-2 mb-6"
            aria-label="Page copy actions"
        >
            <button
                type="button"
                onClick={copyPage}
                className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border shadow-sm transition-colors",
                    pageCopied
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-[#00685f]/30 hover:text-[#00685f]"
                )}
            >
                {pageCopied ? <Check className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                {pageCopied ? "Page copied" : "Copy page"}
            </button>
            <button
                type="button"
                onClick={copyLink}
                className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border shadow-sm transition-colors",
                    linkCopied
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-[#00685f]/30 hover:text-[#00685f]"
                )}
            >
                {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                {linkCopied ? "Link copied" : "Copy link"}
            </button>
        </div>
    );
}
