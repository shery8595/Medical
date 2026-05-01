import React from "react";
import { Sidebar } from "./Sidebar";
import { useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";

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
    <div className={cn(
      "flex min-h-screen relative overflow-hidden transition-colors duration-300",
      role === "patient" ? "bg-slate-50 text-slate-900" : "bg-slate-50 text-slate-900"
    )}>
      <aside className={cn(
        "sticky top-0 h-screen shrink-0 z-10 w-64 lg:w-72 hidden md:block border-r transition-colors duration-300",
        role === "patient" ? "bg-slate-50 border-slate-200" : "bg-slate-50 border-slate-200"
      )}>
        <Sidebar role={role} />
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
}
