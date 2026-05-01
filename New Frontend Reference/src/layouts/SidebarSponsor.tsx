import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";

const NAV_ITEMS_1 = [
  { name: "Dashboard", path: "/sponsor/dashboard", icon: "dashboard" },
  { name: "Active Trials", path: "/sponsor/active-trials", icon: "science" },
  { name: "Patient Matches", path: "/sponsor/patient-matches", icon: "group" },
  { name: "Analytics", path: "/sponsor/analytics", icon: "monitoring" },
  { name: "Audit Logs", path: "/sponsor/audit-logs", icon: "receipt_long" },
];

const NAV_ITEMS_2 = [
  { name: "Profile Settings", path: "/sponsor/profile-settings", icon: "manage_accounts" },
  { name: "Sponsor Verification", path: "/sponsor/verification", icon: "verified_user" },
];

function NavLink({ item }: { item: any; key?: string }) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(item.path);
  return (
    <Link
      to={item.path}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-full font-['Inter'] text-sm tracking-wide transition-all group",
        isActive
          ? "bg-slate-800 text-white font-semibold"
          : "text-slate-500 hover:bg-slate-200 hover:translate-x-1"
      )}
    >
      <span
        className={cn(
          "material-symbols-outlined transition-colors",
          isActive ? "" : "group-hover:text-slate-700"
        )}
        style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
      >
        {item.icon}
      </span>
      <span>{item.name}</span>
    </Link>
  );
}

export function SidebarSponsor() {
  return (
    <aside className="hidden md:flex flex-col h-screen w-72 border-r border-slate-200 bg-slate-100 p-6 space-y-8 shrink-0 relative z-10 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
            corporate_fare
          </span>
        </div>
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-800 text-xl tracking-tight leading-tight">MedVault</h1>
          <div className="bg-[#e0e0ff] inline-flex items-center px-1.5 py-0.5 rounded-full mt-1">
            <span className="font-['Inter'] text-[10px] text-[#4953bc] font-bold uppercase tracking-widest">
              Sponsor
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        <nav className="space-y-1">
          {NAV_ITEMS_1.map((item) => (
             <NavLink key={item.path} item={item} />
          ))}
        </nav>

        <div>
            <h3 className="px-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">Sponsor Area</h3>
            <nav className="space-y-1">
              {NAV_ITEMS_2.map((item) => (
                 <NavLink key={item.path} item={item} />
              ))}
            </nav>
        </div>
      </div>

      {/* CTA & Footer Nav */}
      <div className="mt-auto space-y-6 pt-4 border-t border-slate-300/50">
        <div className="space-y-1">
          <button className="flex w-full items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-full font-['Inter'] text-sm transition-all group hover:translate-x-1">
            <span className="material-symbols-outlined text-[18px] group-hover:text-slate-700">help</span>
            <span>Support</span>
          </button>
          <Link to="/" className="flex w-full items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-full font-['Inter'] text-sm transition-all group hover:translate-x-1">
            <span className="material-symbols-outlined text-[18px] group-hover:text-slate-700">logout</span>
            <span>Sign Out</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
