import React, { ReactNode, useState } from "react";
import { DocsSidebar } from "../../components/docs/DocsSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { DocsFooter } from "../../components/docs/DocsFooter";
import { DocsTopNav, DocsMobileMenuButton } from "../../components/docs/DocsTopNav";
import { DocsPageToolbar } from "../../components/docs/DocsPageToolbar";

interface DocsLayoutProps {
    children: ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
    const location = useLocation();
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [location.pathname]);

    React.useEffect(() => {
        setMobileNavOpen(false);
    }, [location.pathname]);

    return (
        <div
            className="docs-app flex h-screen overflow-hidden bg-[#f7f9fb] font-sans antialiased text-slate-900"
            data-docs-light
        >
            <div className="hidden md:block z-20 shrink-0 h-full">
                <DocsSidebar />
            </div>

            {mobileNavOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-slate-900/40"
                        aria-label="Close menu"
                        onClick={() => setMobileNavOpen(false)}
                    />
                    <div className="relative h-full w-[min(280px,100vw)] shadow-2xl">
                        <DocsSidebar onNavigate={() => setMobileNavOpen(false)} />
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col min-w-0 min-h-0">
                <div className="shrink-0 flex md:hidden items-center gap-3 px-4 h-12 border-b border-slate-200/90 bg-white sticky top-0 z-30">
                    <DocsMobileMenuButton onClick={() => setMobileNavOpen(true)} />
                    <span className="font-display font-bold text-slate-900">Documentation</span>
                </div>

                <DocsTopNav />

                <main
                    ref={scrollRef}
                    className="flex-1 relative overflow-y-auto custom-scrollbar min-h-0 bg-[#f7f9fb] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,104,95,0.06),transparent)]"
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="w-full"
                        >
                            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 pb-28">
                                <DocsPageToolbar />
                                <div id="docs-article-body">{children}</div>
                            </div>
                            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                                <DocsFooter />
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
