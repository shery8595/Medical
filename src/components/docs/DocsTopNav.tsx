import { useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, PanelLeft, Rocket, Layers, Code2, Wrench, Shield } from "lucide-react";
import { cn } from "../../lib/utils";
import { DOCS_TABS, type DocsTabId, getTabForPath, searchDocsNav, getNavItemsForTab } from "../../lib/docsNav";

const tabIcons: Record<DocsTabId, typeof Rocket> = {
    "getting-started": Rocket,
    protocol: Layers,
    clients: Code2,
    operations: Wrench,
    security: Shield,
};

export function DocsTopNav() {
    const navigate = useNavigate();
    const activeTab = getTabForPath(location.pathname);
    const tabMeta = DOCS_TABS.find((t) => t.id === activeTab) ?? DOCS_TABS[0];
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const results = useMemo(() => (q.trim() ? searchDocsNav(q, 8) : []), [q]);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    return (
        <div className="shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
            <div className="px-4 md:px-8 pt-6 pb-0 max-w-[1600px] mx-auto w-full">
                <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-slate-900">
                    Technical <span className="text-[#00685f]">documentation</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-3xl">
                    Docs for MedVault: FHE-backed matching, Arbitrum Sepolia deployment, and how patients and sponsors
                    use the app safely.
                </p>

                <div className="mt-6 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6 pb-3">
                    <div className="flex flex-wrap gap-1.5 min-w-0">
                        {DOCS_TABS.map((tab) => {
                            const Icon = tabIcons[tab.id];
                            const isActive = tab.id === activeTab;
                            return (
                                <Link
                                    key={tab.id}
                                    to={getNavItemsForTab(tab.id)[0]?.href ?? "/docs"}
                                    onClick={(e) => {
                                        if (isActive) {
                                            e.preventDefault();
                                        }
                                    }}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors",
                                        isActive
                                            ? "bg-slate-900 text-white shadow-sm"
                                            : "text-slate-600 border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100 hover:text-slate-900"
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5 opacity-90" />
                                    {tab.label}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex-1 min-w-0 max-w-md lg:ml-auto" ref={searchRef}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <input
                                type="search"
                                placeholder="Search docs and sections…"
                                value={q}
                                onChange={(e) => {
                                    setQ(e.target.value);
                                    setOpen(true);
                                }}
                                onFocus={() => setOpen(true)}
                                className="w-full rounded-full border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#00685f]/20 focus:border-[#00685f]/40"
                            />
                            {open && q.trim() && results.length > 0 && (
                                <ul className="absolute z-50 left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg py-1 text-sm custom-scrollbar">
                                    {results.map(({ item }) => (
                                        <li key={item.href}>
                                            <button
                                                type="button"
                                                className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex flex-col gap-0.5"
                                                onClick={() => {
                                                    navigate(item.href);
                                                    setQ("");
                                                    setOpen(false);
                                                }}
                                            >
                                                <span className="font-semibold text-slate-800">{item.title}</span>
                                                <span className="text-xs text-slate-500">
                                                    {item.section} · {item.href}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {open && q.trim() && results.length === 0 && (
                                <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border border-slate-200 bg-white shadow-lg px-3 py-3 text-sm text-slate-500">
                                    No results. Try &quot;encryption&quot;, &quot;engine&quot;, or &quot;staking&quot;.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <p className="text-sm text-slate-600 pb-4 pt-1 border-t border-slate-100/80">
                    {tabMeta.subtitle}
                </p>
            </div>
        </div>
    );
}

/** Mobile: open docs menu — sidebar is off-canvas; use with DocsSidebar in drawer */
export function DocsMobileMenuButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-700"
            aria-label="Open documentation menu"
        >
            <PanelLeft className="h-5 w-5" />
        </button>
    );
}
