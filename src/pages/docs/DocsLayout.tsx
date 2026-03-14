import React, { ReactNode } from "react";
import { DocsSidebar } from "../../components/docs/DocsSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

interface DocsLayoutProps {
    children: ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
    const location = useLocation();
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [location.pathname]);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#020810] font-sans antialiased text-slate-900 dark:text-slate-50">
            {/* Desktop Sidebar */}
            <div className="hidden md:block z-20">
                <DocsSidebar />
            </div>

            {/* Main Content Area */}
            <main ref={scrollRef} className="flex-1 relative flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
                {/* Mobile Header (simplified for docs) */}
                <div className="md:hidden flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-10 w-full">
                    <span className="font-bold tracking-tight">MedVault Docs</span>
                </div>

                {/* Animated Page Transitions wrapper */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="flex-1 relative w-full h-full"
                    >
                        {/* The page content is rendered here. 
                We use max-w-4xl max-w-prose inside individual pages, 
                but this shell allows full width for diagrams if needed. */}
                        <div className="w-full h-full p-6 md:p-12 lg:p-16">
                            {children}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
