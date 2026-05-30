import React from "react";
import { Sidebar } from "./Sidebar";
import { Link, useLocation } from "react-router-dom";
import brandLogoUrl from "../../../logo/logo.png";
import { cn } from "../../lib/utils";
import {
  dashboardMainInset,
  dashboardMainInsetCompact,
  dashboardSidebarOffsetClass,
  dashboardSidebarWidthClass,
} from "../../lib/dashboardLayout";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "patient" | "sponsor";
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { pathname } = useLocation();
  const compactSponsorPage = role === "sponsor" && pathname.includes("/active-trials");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [pathname]);

  return (
    <div
      className={cn(
        "relative h-[100dvh] max-h-[100dvh] w-full overflow-hidden transition-colors duration-300",
        role === "patient" ? "bg-slate-50 text-slate-900" : "bg-slate-50 text-slate-900",
      )}
    >
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden md:flex flex-col border-r",
          dashboardSidebarWidthClass,
          role === "patient" ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50",
        )}
      >
        <Sidebar role={role} />
      </aside>

      <div className={cn("flex h-full min-h-0 min-w-0 flex-col", dashboardSidebarOffsetClass)}>
        <header className="md:hidden shrink-0 flex items-center gap-2.5 border-b border-slate-200 bg-white px-4 py-3">
          <Link
            to={role === "patient" ? "/patient/dashboard" : "/sponsor/dashboard"}
            className="inline-flex items-center gap-2.5 min-w-0"
          >
            <img
              src={brandLogoUrl}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-lg object-contain"
              aria-hidden
            />
            <span className="font-bold text-slate-900 leading-none">MedVault</span>
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                role === "patient" ? "text-teal-700/80" : "text-[#1D2634]",
              )}
            >
              {role === "patient" ? "Patient" : "Sponsor"}
            </span>
          </Link>
        </header>
        <main
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide"
        >
          <div className={cn(compactSponsorPage ? dashboardMainInsetCompact : dashboardMainInset)}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
