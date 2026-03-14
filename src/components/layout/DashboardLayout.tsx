import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useLocation } from "react-router-dom";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "patient" | "sponsor";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { pathname } = useLocation();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="sticky top-0 h-screen shrink-0 border-r border-slate-200/60 dark:border-slate-800/60">
        <Sidebar role={role} />
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
